import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma.service';
import { CreatePurchaseDto } from './dto/create-purchase.dto';
import { CreatePaymentDto } from './dto/create-payment.dto';
import { LabelsService } from '../labels/labels.service';

@Injectable()
export class PurchasesService {
  constructor(
    private prisma: PrismaService,
    private labels: LabelsService,
  ) {}

  async create(dto: CreatePurchaseDto) {
    const { items, printLabels, ...rest } = dto;
    const purchase = await this.prisma.purchase.create({
      data: {
        ...rest,
        items: {
          create: items.map(i => ({
            productId: i.productId,
            quantity: i.quantity,
            unitCost: i.unitCost,
            subtotal: i.quantity * i.unitCost,
          })),
        },
      },
      include: { items: true },
    });

    const labelItems: { productId: number; quantity: number }[] = [];
    for (const item of purchase.items) {
      const product = await this.prisma.product.update({
        where: { id: item.productId },
        data: { stock: { increment: item.quantity } },
        select: { requiresLabel: true },
      });
      if (printLabels && product.requiresLabel) {
        labelItems.push({ productId: item.productId, quantity: item.quantity });
      }
    }

    let labelsPdf: string | undefined;
    if (labelItems.length) {
      const pdf = await this.labels.generatePdf({ items: labelItems });
      labelsPdf = pdf.toString('base64');
    }
    return { ...purchase, labelsPdf };
  }

  findAll() {
    return this.prisma.purchase.findMany({
      include: { items: true, payments: true, supplier: true },
    });
  }

  async recordPayment(id: string, dto: CreatePaymentDto) {
    const purchase = await this.prisma.purchase.findUnique({ where: { id } });
    if (!purchase) {
      throw new NotFoundException('Purchase not found');
    }
    const payment = await this.prisma.supplierPayment.create({
      data: {
        supplierId: purchase.supplierId,
        purchaseId: id,
        amount: dto.amount,
        notes: dto.notes,
      },
    });
    await this.prisma.purchase.update({
      where: { id },
      data: { paidAmount: { increment: dto.amount } },
    });
    return payment;
  }
}
