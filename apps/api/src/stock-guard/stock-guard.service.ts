import { Injectable, ConflictException } from '@nestjs/common';
import { PrismaService } from '../prisma.service';
import { VariantConsumeMode, AuditActionType } from '@prisma/client';
import { AuditService } from '../audit/audit.service';

interface ConsumptionPlan {
  plan: 'PACK_ONLY' | 'BULK_ONLY' | 'MIXED';
  packUnits: number;
  bulkKg: number;
  contentKg: number;
}

@Injectable()
export class StockGuardService {
  constructor(private prisma: PrismaService, private audit: AuditService) {}

  async resolveVariantConsumption(variantId: string, qtyPacks: number): Promise<ConsumptionPlan> {
    const variant = await this.prisma.packVariant.findUnique({
      where: { id: variantId },
      include: { parentProduct: true },
    });
    if (!variant) throw new ConflictException('Variante no encontrada');
    const stockPacks = variant.stockPacks;
    const stockKg = Number(variant.parentProduct.stock);
    const contentKg = Number(variant.contentKg);
    const neededKg = qtyPacks * contentKg;
    let plan: ConsumptionPlan;
    switch (variant.consumeMode) {
      case VariantConsumeMode.SOLO_PACK:
        if (stockPacks < qtyPacks) throw new ConflictException('Stock insuficiente de pack');
        plan = { plan: 'PACK_ONLY', packUnits: qtyPacks, bulkKg: 0, contentKg };
        break;
      case VariantConsumeMode.SOLO_GRANEL:
        if (stockKg < neededKg) throw new ConflictException('Stock granel insuficiente');
        plan = { plan: 'BULK_ONLY', packUnits: 0, bulkKg: neededKg, contentKg };
        break;
      default:
        if (stockPacks >= qtyPacks) {
          plan = { plan: 'PACK_ONLY', packUnits: qtyPacks, bulkKg: 0, contentKg };
        } else {
          const remainingPacks = stockPacks;
          const bulkNeeded = (qtyPacks - remainingPacks) * contentKg;
          if (stockKg < bulkNeeded) throw new ConflictException('Stock insuficiente');
          plan = { plan: 'MIXED', packUnits: remainingPacks, bulkKg: bulkNeeded, contentKg };
        }
    }
    await this.audit.log({
      userId: 'system',
      userEmail: 'system',
      actionType: AuditActionType.VARIANT_CONSUME_PLAN_CREATED,
      entity: 'PackVariant',
      entityId: variantId,
      details: JSON.stringify(plan),
    });
    return plan;
  }

  async commitPlan(saleId: string, variantId: string, plan: ConsumptionPlan) {
    await this.prisma.$transaction(async prisma => {
      if (plan.packUnits) {
        await prisma.packVariant.update({ where: { id: variantId }, data: { stockPacks: { decrement: plan.packUnits } } });
      }
      if (plan.bulkKg) {
        const variant = await prisma.packVariant.findUnique({ where: { id: variantId } });
        await prisma.product.update({ where: { id: variant!.parentProductId }, data: { stock: { decrement: plan.bulkKg } } });
        const unitCost = Number((await prisma.product.findUnique({ where: { id: variant!.parentProductId } }))!.costARS);
        await prisma.costLedger.create({ data: {
          productId: variant!.parentProductId,
          type: 'SALE_COGS',
          refTable: 'Sale',
          refId: saleId,
          qty: -plan.bulkKg,
          unitCostArs: unitCost,
          totalCostArs: -plan.bulkKg * unitCost,
        }});
      }
      if (plan.packUnits) {
        const variant = await this.prisma.packVariant.findUnique({
          where: { id: variantId },
          include: { parentProduct: true },
        });
        const base =
          Number(variant?.parentProduct?.pricePerKg ?? 0) *
          Number(variant?.contentKg ?? 0);
        const cost = Number(variant?.avgCostArs ?? base);
        const unitCost = cost / Math.max(1, Number(variant?.contentKg ?? 1));
        const totalCost = -Number(plan.packUnits ?? 0) * cost;
        await prisma.costLedger.create({
          data: {
            productId: variant!.parentProductId,
            type: 'SALE_COGS',
            refTable: 'Sale',
            refId: saleId,
            qty: -Number(plan.packUnits ?? 0) * Number(variant!.contentKg),
            unitCostArs: unitCost,
            totalCostArs: totalCost,
          },
        });
      }
    });
    await this.audit.log({
      userId: 'system',
      userEmail: 'system',
      actionType: AuditActionType.VARIANT_CONSUME_COMMIT,
      entity: 'Sale',
      entityId: saleId,
      details: JSON.stringify(plan),
    });
  }
}

