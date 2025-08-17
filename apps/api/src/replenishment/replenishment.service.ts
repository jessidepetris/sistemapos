import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma.service';
import { randomUUID } from 'crypto';
import { Prisma } from '@prisma/client';

interface OverrideDto {
  id: string;
  suggestedQty?: number;
  exclude?: boolean;
}

@Injectable()
export class ReplenishmentService {
  constructor(private prisma: PrismaService) {}

  async run() {
    const batchId = randomUUID();
    const settings = await this.prisma.systemSetting.findFirst();
    const defaultMin = settings?.defaultMinStock ?? 0;
    const targetDays = settings?.reorderTargetDays ?? 14;

    const [products, rules, stats] = await Promise.all([
      this.prisma.product.findMany(),
      this.prisma.reorderRule.findMany({ where: { active: true } }),
      this.prisma.productStats.findMany(),
    ]);

    const ruleMap = new Map(rules.map(r => [r.productId, r]));
    const statsMap = new Map(stats.map(s => [s.productId, s]));

    const suggestions: Prisma.PrismaPromise<any>[] = [];
    for (const p of products) {
      const rule = ruleMap.get(p.id);
      const stat = statsMap.get(p.id);
      const minStock = rule?.minStock ?? p.minStock ?? defaultMin;
      const avgDaily = stat?.avgDailySales ? Number(stat.avgDailySales) : 0;
      const tgtDays = rule?.targetDays ?? targetDays;
      const targetStock = avgDaily * tgtDays;
      if (Number(p.stock) <= Math.max(Number(minStock), Number(targetStock))) {
        const suggestedQty = Math.ceil(
          Math.max(Number(targetStock), Number(minStock)) - Number(p.stock),
        );
        if (suggestedQty > 0) {
          suggestions.push(
            this.prisma.purchaseSuggestion.create({
              data: {
                batchId,
                productId: p.id,
                supplierId: rule?.supplierId,
                suggestedQty,
                reason: 'Below MinStock',
              },
            }),
          );
        }
      }
    }
    await this.prisma.$transaction(suggestions);
    return { batchId };
  }

  getBatch(batchId: string) {
    return this.prisma.purchaseSuggestion.findMany({
      where: { batchId },
      include: { product: true, supplier: true },
    });
  }

  async override(batchId: string, overrides: OverrideDto[]) {
    const tx: Prisma.PrismaPromise<any>[] = [];
    for (const o of overrides) {
      if (o.exclude) {
        tx.push(
          this.prisma.purchaseSuggestion.delete({ where: { id: o.id } }),
        );
      } else if (o.suggestedQty !== undefined) {
        tx.push(
          this.prisma.purchaseSuggestion.update({
            where: { id: o.id },
            data: { suggestedQty: o.suggestedQty },
          }),
        );
      }
    }
    await this.prisma.$transaction(tx);
    return this.getBatch(batchId);
  }

  async createDrafts(batchId: string) {
    const suggestions = await this.prisma.purchaseSuggestion.findMany({
      where: { batchId },
      include: { product: true },
    });
    const grouped = new Map<string, typeof suggestions>();
    for (const s of suggestions) {
      if (!s.supplierId) continue;
      if (!grouped.has(s.supplierId)) grouped.set(s.supplierId, []);
      grouped.get(s.supplierId)!.push(s);
    }
    const purchases: string[] = [];
    for (const [supplierId, items] of grouped.entries()) {
      const purchase = await this.prisma.purchase.create({
        data: {
          supplierId,
          total: items.reduce((sum, i) => sum + i.suggestedQty * Number(i.product.costARS), 0),
          notes: `draft from batch ${batchId}`,
          status: 'DRAFT',
          draftBatchId: batchId,
          items: {
            create: items.map(i => ({
              productId: i.productId,
              quantity: i.suggestedQty,
              unitCost: i.product.costARS,
              subtotal: new Prisma.Decimal(i.product.costARS).mul(i.suggestedQty),
              suggestedQty: i.suggestedQty,
            })),
          },
        },
      });
      purchases.push(purchase.id);
    }
    return { purchases };
  }

  getRules() {
    return this.prisma.reorderRule.findMany();
  }

  upsertRule(data: any) {
    return this.prisma.reorderRule.upsert({
      where: { id: data.id ?? '' },
      create: data,
      update: data,
    });
  }
}
