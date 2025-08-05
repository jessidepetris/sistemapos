import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma.service';
import { startOfDay, endOfDay, parseISO } from 'date-fns';

@Injectable()
export class ReportsService {
  constructor(private prisma: PrismaService) {}

  async salesReport(from?: string, to?: string) {
    const where: any = {};
    if (from || to) {
      where.createdAt = {};
      if (from) where.createdAt.gte = startOfDay(parseISO(from));
      if (to) where.createdAt.lte = endOfDay(parseISO(to));
    }
    const sales = await this.prisma.sale.findMany({
      where,
      include: { items: true },
    });

    const totalSales = sales.reduce((sum, s) => sum + Number(s.total), 0);
    const byClient: Record<string, number> = {};
    const byPaymentMethod: Record<string, number> = {};
    const byType: Record<string, number> = {};
    const byProduct: Record<string, { quantity: number; total: number }> = {};

    for (const sale of sales) {
      const clientKey = sale.customerId ? `#${sale.customerId}` : sale.customerName;
      byClient[clientKey] = (byClient[clientKey] || 0) + Number(sale.total);
      byPaymentMethod[sale.paymentMethod] =
        (byPaymentMethod[sale.paymentMethod] || 0) + Number(sale.total);
      byType[sale.type] = (byType[sale.type] || 0) + Number(sale.total);
      for (const item of sale.items) {
        const prod = byProduct[item.productId] || { quantity: 0, total: 0 };
        prod.quantity += item.quantity;
        prod.total += Number(item.price) * item.quantity - Number(item.discount);
        byProduct[item.productId] = prod;
      }
    }

    return { totalSales, byClient, byProduct, byPaymentMethod, byType };
  }

  async accountsReceivableReport() {
    const clients = await this.prisma.client.findMany({
      include: { accountMovements: true },
    });
    const results = [] as any[];
    for (const client of clients) {
      let balance = 0;
      let lastPayment: Date | null = null;
      let overdue = 0;
      for (const mov of client.accountMovements) {
        if (mov.type === 'CARGO') {
          balance += Number(mov.amount);
          if (new Date(mov.createdAt) < new Date(Date.now() - 30 * 86400000)) {
            overdue += Number(mov.amount);
          }
        } else {
          balance -= Number(mov.amount);
          if (!lastPayment || mov.createdAt > lastPayment) lastPayment = mov.createdAt;
        }
      }
      if (balance > 0) {
        results.push({
          clientId: client.id,
          clientName: client.name,
          balance,
          lastPayment,
          overdue,
        });
      }
    }
    return results;
  }

  async stockReport() {
    const products = await this.prisma.product.findMany({ include: { saleItems: true } });
    const lowStock = products.filter((p) => p.stock < p.minStock);
    const noMovement = products.filter((p) => p.saleItems.length === 0);
    const stockValue = products.reduce(
      (sum, p) => sum + Number(p.costARS) * p.stock,
      0,
    );
    return { lowStock, noMovement, stockValue };
  }

  async deliveriesReport(status?: string) {
    const deliveries = await this.prisma.delivery.findMany({
      where: status ? { status: status as any } : {},
      include: { quotation: true },
    });
    const delivered = deliveries.filter((d) => d.status === 'ENTREGADO');
    const averageTime =
      delivered.reduce((sum, d) => sum + (d.updatedAt.getTime() - d.createdAt.getTime()), 0) /
      (delivered.length || 1);
    const deliveredToday = delivered.filter((d) => {
      const today = new Date();
      return (
        d.updatedAt.getDate() === today.getDate() &&
        d.updatedAt.getMonth() === today.getMonth() &&
        d.updatedAt.getFullYear() === today.getFullYear()
      );
    }).length;
    return { deliveries, averageTime, deliveredToday };
  }
}
