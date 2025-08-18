import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma.service';
import { CacheService } from '../cache/cache.service';
import { startOfDay, endOfDay, parseISO, subDays, differenceInCalendarDays } from 'date-fns';

@Injectable()
export class KpisService {
  constructor(private prisma: PrismaService, private cache: CacheService) {}

  private buildDateRange(from?: string, to?: string) {
    const where: any = {};
    if (from || to) {
      where.createdAt = {};
      if (from) where.createdAt.gte = startOfDay(parseISO(from));
      if (to) where.createdAt.lte = endOfDay(parseISO(to));
    }
    return where;
  }

  async sales(granularity = 'daily', from?: string, to?: string) {
    const where = this.buildDateRange(from, to);
    const cacheKey = `kpis:sales:${granularity}:${from || ''}:${to || ''}`;
    const cached = await this.cache.get<any>(cacheKey);
    if (cached) return cached;
    const sales = await this.prisma.sale.findMany({
      where,
      select: { createdAt: true, total: true },
    });
    const series: Record<string, number> = {};
    for (const sale of sales) {
      let key: string;
      const date = sale.createdAt;
      if (granularity === 'monthly') {
        key = `${date.getFullYear()}-${date.getMonth() + 1}`;
      } else if (granularity === 'weekly') {
        const week = Math.ceil(((date.getDate() - date.getDay()) + 1) / 7);
        key = `${date.getFullYear()}-W${week}`;
      } else {
        key = date.toISOString().slice(0, 10);
      }
      series[key] = (series[key] || 0) + Number(sale.total);
    }
    const total = Object.values(series).reduce((a, b) => a + b, 0);
    const days = differenceInCalendarDays(
      to ? parseISO(to) : new Date(),
      from ? parseISO(from) : subDays(new Date(), 1),
    ) + 1;
    const prevFrom = from ? subDays(parseISO(from), days) : subDays(new Date(), days);
    const prevTo = from ? subDays(parseISO(from), 1) : subDays(new Date(), 1);
    const prevSales = await this.prisma.sale.findMany({
      where: this.buildDateRange(prevFrom.toISOString(), prevTo.toISOString()),
      select: { total: true },
    });
    const prevTotal = prevSales.reduce((sum, s) => sum + Number(s.total), 0);
    const result = { series, total, delta: total - prevTotal };
    await this.cache.set(cacheKey, result, 300);
    return result;
  }

  async margin(granularity = 'daily', from?: string, to?: string) {
    const where = this.buildDateRange(from, to);
    const items = await this.prisma.saleItem.findMany({
      where: { sale: where },
      select: {
        quantity: true,
        price: true,
        discount: true,
        product: { select: { costARS: true } },
        sale: { select: { createdAt: true } },
      },
    });
    const series: Record<string, number> = {};
    for (const item of items) {
      const date = item.sale.createdAt;
      let key: string;
      if (granularity === 'monthly') {
        key = `${date.getFullYear()}-${date.getMonth() + 1}`;
      } else if (granularity === 'weekly') {
        const week = Math.ceil(((date.getDate() - date.getDay()) + 1) / 7);
        key = `${date.getFullYear()}-W${week}`;
      } else {
        key = date.toISOString().slice(0, 10);
      }
      const price = Number(item.price) * Number(item.quantity) - Number(item.discount ?? 0);
      const m = price - Number(item.product.costARS) * Number(item.quantity);
      series[key] = (series[key] || 0) + m;
    }
    const total = Object.values(series).reduce((a, b) => a + b, 0);
    return { series, total };
  }

  async ticketAvg(from?: string, to?: string) {
    const where = this.buildDateRange(from, to);
    const sales = await this.prisma.sale.findMany({ where, select: { total: true } });
    const total = sales.reduce((sum, s) => sum + Number(s.total), 0);
    return { average: sales.length ? total / sales.length : 0 };
  }

  async topProducts(metric: string, limit: number, from?: string, to?: string) {
    const where = this.buildDateRange(from, to);
    const items = await this.prisma.saleItem.findMany({
      where: { sale: where },
      select: {
        productId: true,
        quantity: true,
        price: true,
        discount: true,
        product: { select: { id: true, name: true, costARS: true } },
      },
    });
    const map = new Map<string, { name: string; total: number }>();
    for (const item of items) {
      const key = String(item.productId ?? item.product?.id ?? 'unknown');
      const current = map.get(key) || { name: item.product?.name ?? 'N/D', total: 0 };
      const price =
        Number(item.price) * Number(item.quantity) - Number(item.discount ?? 0);
      const value =
        metric === 'margin'
          ? price - Number(item.product.costARS) * Number(item.quantity)
          : price;
      current.total += value;
      map.set(key, current);
    }
    return Array.from(map.values())
      .sort((a, b) => b.total - a.total)
      .slice(0, limit);
  }

  async topClients(metric: string, limit: number, from?: string, to?: string) {
    const where = this.buildDateRange(from, to);
    const sales = await this.prisma.sale.findMany({
      where,
      select: { customerId: true, customerName: true, subtotal: true, discount: true, total: true },
    });
    const map = new Map<string, { name: string; total: number }>();
    for (const sale of sales) {
      const key = sale.customerId || sale.customerName;
      const name = sale.customerName;
      const total = Number(sale.total);
      map.set(key, {
        name,
        total: (map.get(key)?.total || 0) + (metric === 'margin' ? Number(sale.subtotal) - Number(sale.discount) : total),
      });
    }
    return Array.from(map.values())
      .sort((a, b) => b.total - a.total)
      .slice(0, limit);
  }

  async paymentsMix(from?: string, to?: string) {
    const where = this.buildDateRange(from, to);
    const payments = await this.prisma.payment.findMany({
      where: { status: 'APPROVED', sale: where },
    });
    const totals: Record<string, number> = {};
    let total = 0;
    for (const pay of payments) {
      const key = pay.methodLabel || pay.gateway;
      totals[key] = (totals[key] || 0) + Number(pay.amount);
      total += Number(pay.amount);
    }
    return Object.entries(totals).map(([method, amount]) => ({ method, percent: total ? amount / total : 0 }));
  }

  async receivables(buckets: number[]) {
    const clients = await this.prisma.client.findMany({ include: { accountMovements: true } });
    const today = new Date();
    return clients.map((c) => {
      let balance = 0;
      const bucketSums = buckets.map(() => 0);
      for (const mov of c.accountMovements) {
        const amt = Number(mov.amount);
        if (mov.type === 'CARGO') {
          balance += amt;
          const days = (today.getTime() - new Date(mov.createdAt).getTime()) / 86400000;
          for (let i = buckets.length - 1; i >= 0; i--) {
            if (days > buckets[i]) {
              bucketSums[i] += amt;
              break;
            }
          }
        } else {
          balance -= amt;
        }
      }
      return { clientId: c.id, clientName: c.name, balance, buckets: bucketSums };
    });
  }

  async purchasesCost(from?: string, to?: string) {
    const where = this.buildDateRange(from, to);
    const purchases = await this.prisma.purchase.findMany({ where });
    const total = purchases.reduce((sum, p) => sum + Number(p.total), 0);
    return { total };
  }

  async stockCoverage() {
    const stats = await this.prisma.productStats.findMany({ include: { product: true } });
    const coverages = stats.map((s) => ({
      productId: s.productId,
      days: s.avgDailySales ? Number(s.product.stock) / Number(s.avgDailySales) : null,
    }));
    return coverages;
  }

  async marginNet(from?: string, to?: string) {
    const where = this.buildDateRange(from, to);
    const sales = await this.prisma.sale.findMany({ where, include: { payments: true, items: true } });
    let salesGross = 0;
    let cogs = 0;
    let fees = 0;
    for (const sale of sales) {
      salesGross += Number(sale.total);
      for (const item of sale.items) {
        cogs += Number(item.cogsTotalArs || 0);
      }
      for (const pay of sale.payments.filter((p) => p.status === 'APPROVED')) {
        fees += Number(pay.fee || 0);
      }
    }
    const netMarginArs = salesGross - cogs - fees;
    const netMarginPct = salesGross ? (netMarginArs / salesGross) * 100 : 0;
    return { salesGross, cogs, fees, netMarginArs, netMarginPct };
  }

  async marginNetSeries(granularity: string, from?: string, to?: string) {
    const where = this.buildDateRange(from, to);
    const sales = await this.prisma.sale.findMany({
      where,
      include: { payments: true, items: true },
    });
    const buckets: Record<string, { sales: number; cogs: number; fees: number }> = {};
    for (const sale of sales) {
      const date = sale.createdAt;
      let key: string;
      if (granularity === 'monthly') {
        key = `${date.getFullYear()}-${date.getMonth() + 1}`;
      } else if (granularity === 'weekly') {
        const week = Math.ceil(((date.getDate() - date.getDay()) + 1) / 7);
        key = `${date.getFullYear()}-W${week}`;
      } else {
        key = date.toISOString().slice(0, 10);
      }
      const bucket = buckets[key] || { sales: 0, cogs: 0, fees: 0 };
      bucket.sales += Number(sale.total);
      bucket.cogs += sale.items.reduce((s, i) => s + Number(i.cogsTotalArs || 0), 0);
      bucket.fees += sale.payments
        .filter((p) => p.status === 'APPROVED')
        .reduce((s, p) => s + Number(p.fee || 0), 0);
      buckets[key] = bucket;
    }
    return Object.entries(buckets).map(([date, v]) => ({
      date,
      salesGross: v.sales,
      cogs: v.cogs,
      fees: v.fees,
      netMarginArs: v.sales - v.cogs - v.fees,
      netMarginPct: v.sales ? ((v.sales - v.cogs - v.fees) / v.sales) * 100 : 0,
    }));
  }
}
