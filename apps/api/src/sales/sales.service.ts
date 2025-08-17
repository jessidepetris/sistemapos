import { ConflictException, Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma.service';
import { CreateSaleDto } from './dto/create-sale.dto';
import {
  PaymentGateway,
  PaymentStatus,
  AuditActionType,
  PaymentMethod,
  CashMovementType,
  CashRegisterStatus,
  SaleType,
} from '@prisma/client';
import PDFDocument from 'pdfkit';
import { PromotionsService } from '../promotions/promotions.service';
import { AuditService } from '../audit/audit.service';
import { PaymentsService } from '../payments/payments.service';
import { StockGuardService } from '../stock-guard/stock-guard.service';
import { IdempotencyService } from '../idempotency/idempotency.service';

@Injectable()
export class SalesService {
  constructor(
    private prisma: PrismaService,
    private promotions: PromotionsService,
    private audit: AuditService,
    private payments: PaymentsService,
    private stockGuard: StockGuardService,
    private idempotency: IdempotencyService,
  ) {}

  async create(
    data: CreateSaleDto,
    user?: { id?: string; email?: string },
    idempotencyKey?: string,
  ) {
    if (idempotencyKey) {
      const existing = await this.idempotency.get(idempotencyKey, 'POST:/sales', data);
      if (existing) return existing;
    }
    const result = await this.prisma.$transaction(async prisma => {
      if (user?.id) {
        const session = await prisma.cashRegisterSession.findFirst({
          where: { openedById: user.id, status: CashRegisterStatus.OPEN },
        });
        if (!session) {
          throw new ConflictException('Debe abrir caja');
        }
      }
      const items = await Promise.all(
        data.items.map(async i => {
          let meta: any = undefined;
          if (i.variantId) {
            const plan = await this.stockGuard.resolveVariantConsumption(i.variantId, i.quantity);
            meta = plan;
          }
          return { ...i, meta };
        })
      );
      const promo = await this.promotions.applyPromotions(items);
      const subtotal = items.reduce((sum, i) => sum + i.price * i.quantity - (i.discount || 0), 0);
      const discount = data.discount + promo.discount;
      const total = subtotal - discount;
      const sale = await prisma.sale.create({
        data: {
          customerName: data.customerName,
          customerId: data.customerId,
          type: data.type,
          subtotal,
          discount,
          total,
          paid: 0,
          balance: total,
          items: {
            create: items.map(item => ({
              productId: item.productId,
              quantity: item.quantity,
              price: item.price,
              discount: item.discount || 0,
              variantId: item.variantId,
              meta: item.meta ? item.meta : undefined,
            })),
          },
        },
        include: { items: true },
      });

      const payments: any[] = [];
      for (const p of data.payments) {
        if (p.gateway === PaymentGateway.OFFLINE) {
          const payment = await prisma.payment.create({
            data: {
              saleId: sale.id,
              gateway: PaymentGateway.OFFLINE,
              methodLabel: p.methodLabel,
              amount: p.amount,
              status: p.status || PaymentStatus.APPROVED,
              netAmount: p.amount,
            },
          });
          payments.push(payment);
          if (user?.id && p.methodLabel === 'EFECTIVO') {
            const session = await prisma.cashRegisterSession.findFirst({
              where: { openedById: user.id, status: CashRegisterStatus.OPEN },
            });
            if (session) {
              await prisma.cashMovement.create({
                data: {
                  sessionId: session.id,
                  type: CashMovementType.SALE,
                  paymentMethod: PaymentMethod.CASH,
                  amount: p.amount,
                  concept: `Venta ${sale.id}`,
                  relatedSaleId: sale.id,
                },
              });
            }
          }
        } else if (p.gateway === PaymentGateway.MP) {
          const payment = await this.payments.createMercadoPago({
            saleId: sale.id,
            amount: p.amount,
            description: `Venta ${sale.id}`,
            customer: { email: user?.email, name: data.customerName },
          });
          payments.push(payment);
        } else if (p.gateway === PaymentGateway.GETNET) {
          const payment = await this.payments.createGetnet({
            saleId: sale.id,
            amount: p.amount,
            description: `Venta ${sale.id}`,
          });
          payments.push(payment);
        }
      }
      const paid = payments
        .filter(p => p.status === PaymentStatus.APPROVED)
        .reduce((sum, p) => sum + Number(p.amount), 0);
      await prisma.sale.update({
        where: { id: sale.id },
        data: { paid, balance: total - paid },
      });

      for (const item of sale.items) {
        if (item.variantId && item.meta) {
          await this.stockGuard.commitPlan(sale.id, item.variantId, item.meta as any);
          const variant = await prisma.packVariant.findUnique({
            where: { id: item.variantId },
            include: { parentProduct: true },
          });
          const contentKg = Number(variant!.contentKg);
          const packCost = variant!.avgCostArs
            ? Number(variant!.avgCostArs)
            : Number(variant!.parentProduct.pricePerKg || 0) * contentKg;
          const bulkCost = Number(variant!.parentProduct.costARS);
          let totalCost = 0;
          const meta = (item.meta ?? {}) as {
            plan?: string;
            packUnits?: number;
            bulkKg?: number;
          };
          if (meta.plan === 'PACK_ONLY') {
            totalCost = packCost * (meta.packUnits ?? 0);
          } else if (meta.plan === 'BULK_ONLY') {
            totalCost = bulkCost * (meta.bulkKg ?? 0);
          } else {
            totalCost = packCost * (meta.packUnits ?? 0) + bulkCost * (meta.bulkKg ?? 0);
          }
          await prisma.saleItem.update({
            where: { id: item.id },
            data: {
              cogsUnitArs: totalCost / Number(item.quantity),
              cogsTotalArs: totalCost,
            },
          });
        } else {
          const product = await prisma.product.findUnique({
            where: { id: item.productId },
            include: { kitItems: true },
          });
          if (product?.isComposite) {
            for (const ki of product.kitItems) {
              await prisma.product.update({
                where: { id: ki.componentId },
                data: {
                  stock: { decrement: Number(ki.quantity) * Number(item.quantity) },
                },
              });
            }
          } else {
            await prisma.product.update({
              where: { id: item.productId },
              data: { stock: { decrement: item.quantity } },
            });
          }
        }
      }
      if (data.customerId && data.payments.some(p => p.methodLabel === 'CUENTA_CORRIENTE')) {
        await prisma.accountMovement.create({
          data: {
            clientId: data.customerId,
            type: 'CARGO',
            amount: total,
            description: `Venta ${sale.id}`,
            saleId: sale.id,
          },
        });
      }
      await this.audit.log({
        userId: user?.id ?? 'unknown',
        userEmail: user?.email ?? 'unknown',
        actionType: AuditActionType.CREACION,
        entity: 'Venta',
        entityId: sale.id,
        details: `Venta creada por ${data.customerName}`,
      });
      return prisma.sale.findUnique({ where: { id: sale.id }, include: { items: true, payments: true } });
    });
    if (idempotencyKey) {
      await this.idempotency.save(idempotencyKey, 'POST:/sales', data, result);
    }
    return result;
  }

  findAll(params: { from?: Date; to?: Date; customerId?: number; type?: SaleType }) {
    const { from, to, customerId, type } = params;
    return this.prisma.sale.findMany({
      where: {
        createdAt: {
          gte: from,
          lte: to,
        },
        customerId,
        type,
      },
      include: { items: true },
    });
  }

  findOne(id: string) {
    return this.prisma.sale.findUnique({ where: { id }, include: { items: true } });
  }

  async generatePdf(id: string): Promise<Buffer> {
    const sale = await this.findOne(id);
    const doc = new PDFDocument();
    const chunks: Buffer[] = [];
    doc.on('data', chunk => chunks.push(chunk as Buffer));
    return new Promise(resolve => {
      doc.on('end', () => resolve(Buffer.concat(chunks)));
      doc.fontSize(16).text(`Venta ${sale.id}`);
      doc.text(`Cliente: ${sale.customerName}`);
      doc.text(`Tipo: ${sale.type}`);
      doc.moveDown();
      sale.items.forEach(item => {
        doc.text(`Producto ${item.productId} x${item.quantity} - $${item.price}`);
      });
      doc.moveDown();
      doc.text(`Total: $${sale.total}`);
      doc.end();
    });
  }
}
