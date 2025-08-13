import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma.service';
import { CreatePurchaseDto } from './dto/create-purchase.dto';
import { CreatePaymentDto } from './dto/create-payment.dto';
import { LabelsService } from '../labels/labels.service';
import { UpdatePurchaseDto } from './dto/update-purchase.dto';
import { ReceivePurchaseDto } from './dto/receive-purchase.dto';
import { AuditService } from '../audit/audit.service';
import PDFDocument from 'pdfkit';
import { Prisma } from '@prisma/client';

@Injectable()
export class PurchasesService {
  constructor(
    private prisma: PrismaService,
    private labels: LabelsService,
    private audit: AuditService,
  ) {}

  async create(dto: CreatePurchaseDto) {
    const { items, printLabels, ...rest } = dto;
    const purchase = await this.prisma.purchase.create({
      data: {
        ...rest,
        status: 'RECEIVED_FULL',
        items: {
          create: items.map(i => ({
            productId: i.productId,
            quantity: i.quantity,
            unitCost: i.unitCost,
            subtotal: i.quantity * i.unitCost,
            packSize: i.packSize,
            suggestedQty: i.suggestedQty,
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

  findOne(id: string) {
    return this.prisma.purchase.findUnique({
      where: { id },
      include: { items: true, supplier: true, receipts: { include: { items: true } } },
    });
  }

  async update(id: string, dto: UpdatePurchaseDto) {
    const { items, ...rest } = dto;
    if (items) {
      for (const it of items) {
        await this.prisma.purchaseItem.update({
          where: { id: it.id },
          data: { quantity: it.quantity, unitCost: it.unitCost, packSize: it.packSize },
        });
      }
    }
    if (Object.keys(rest).length) {
      await this.prisma.purchase.update({ where: { id }, data: rest });
    }
    return this.findOne(id);
  }

  async confirm(id: string) {
    await this.prisma.purchase.update({
      where: { id },
      data: { status: 'SENT' },
    });
    await this.audit.log({
      userId: 'system',
      userEmail: 'system',
      actionType: 'CAMBIO_ESTADO',
      entity: 'Purchase',
      entityId: id,
      details: 'OC confirmada',
    });
    return this.findOne(id);
  }

  async pdf(id: string) {
    const purchase = await this.findOne(id);
    if (!purchase) throw new NotFoundException('Purchase not found');
    const doc = new PDFDocument();
    doc.text(`Orden de Compra #${purchase.id}`);
    doc.text(`Proveedor: ${purchase.supplier?.name || purchase.supplierId}`);
    doc.moveDown();
    purchase.items.forEach(it => {
      doc.text(`${it.quantity} x ${it.productId} $${it.unitCost}`);
    });
    doc.text(`Total: ${purchase.total}`);
    doc.end();
    const chunks: Buffer[] = [];
    return await new Promise<Buffer>((resolve) => {
      doc.on('data', c => chunks.push(c));
      doc.on('end', () => resolve(Buffer.concat(chunks)));
    });
  }

  async whatsappLink(id: string) {
    const purchase = await this.findOne(id);
    if (!purchase) throw new NotFoundException('Purchase not found');
    const url = `https://example.com/purchases/${id}/pdf`;
    const msg = `Hola ${purchase.supplier?.name || ''}, adjunto OC #${id} por ${purchase.total}. PDF: ${url}`;
    return {
      link: `https://wa.me/${purchase.supplier?.phone || ''}?text=${encodeURIComponent(msg)}`,
    };
  }

  async receive(id: string, dto: ReceivePurchaseDto) {
    const purchase = await this.prisma.purchase.findUnique({
      where: { id },
      include: { items: true },
    });
    if (!purchase) throw new NotFoundException('Purchase not found');

    const grn = await this.prisma.goodsReceipt.create({
      data: {
        purchaseId: id,
        notes: dto.notes,
        items: {
          create: dto.items.map(it => ({
            productId: it.productId,
            receivedQty: it.receivedQty,
            unitCost: it.unitCost,
          })),
        },
      },
      include: { items: true },
    });

    const labelItems: { productId: number; quantity: number }[] = [];
    for (const item of grn.items) {
      const product = await this.prisma.product.update({
        where: { id: item.productId },
        data: { stock: { increment: item.receivedQty } },
        select: { requiresLabel: true },
      });
      if (dto.printLabels && product.requiresLabel) {
        labelItems.push({ productId: item.productId, quantity: item.receivedQty });
      }
    }

    if (labelItems.length) {
      await this.labels.generatePdf({ items: labelItems });
    }

    const totalOrdered = purchase.items.reduce((s, it) => s + it.quantity, 0);
    const totalReceived = await this.prisma.goodsReceiptItem.aggregate({
      _sum: { receivedQty: true },
      where: { grn: { purchaseId: id } },
    });
    const received = totalReceived._sum.receivedQty ?? 0;
    let status: any = 'RECEIVED_PARTIAL';
    if (received >= totalOrdered) status = 'RECEIVED_FULL';
    await this.prisma.purchase.update({ where: { id }, data: { status } });

    await this.audit.log({
      userId: 'system',
      userEmail: 'system',
      actionType: 'CAMBIO_ESTADO',
      entity: 'Purchase',
      entityId: id,
      details: status === 'RECEIVED_FULL' ? 'Recepción completa' : 'Recepción parcial',
    });

    return grn;
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

  async transitSummary() {
    const now = new Date();
    const settings = await this.prisma.systemSetting.findFirst();
    const dueDays = settings?.transitDueSoonDays ?? 5;
    const purchases = await this.prisma.purchase.findMany({
      where: { status: { in: ['SENT', 'RECEIVED_PARTIAL'] } },
      include: { items: true, receipts: { include: { items: true } } },
    });
    const totalSent = purchases.filter(p => p.status === 'SENT').length;
    const totalPartial = purchases.filter(p => p.status === 'RECEIVED_PARTIAL').length;
    const lateCount = purchases.filter(p => p.expectedDate && p.expectedDate < now).length;
    const dueSoonCount = purchases.filter(
      p => p.expectedDate && p.expectedDate >= now && p.expectedDate <= new Date(now.getTime() + dueDays * 86400000),
    ).length;
    let inTransitAmount = 0;
    const expLeads: number[] = [];
    const actualLeads: number[] = [];
    for (const p of purchases) {
      const receivedVal = p.receipts.flatMap(r => r.items).reduce((s, it) => s + Number(it.receivedQty) * Number(it.unitCost), 0);
      inTransitAmount += Number(p.total) - receivedVal;
      if (p.expectedDate) {
        expLeads.push((p.expectedDate.getTime() - p.date.getTime()) / 86400000);
      }
      if (p.status === 'RECEIVED_FULL' && p.receipts.length) {
        const last = p.receipts.reduce((a, b) => (a.receivedAt > b.receivedAt ? a : b));
        actualLeads.push((last.receivedAt.getTime() - p.date.getTime()) / 86400000);
      }
    }
    const avgLeadExpected = expLeads.length ? expLeads.reduce((a, b) => a + b, 0) / expLeads.length : 0;
    const avgLeadActual = actualLeads.length ? actualLeads.reduce((a, b) => a + b, 0) / actualLeads.length : 0;
    return {
      totalSent,
      totalPartial,
      lateCount,
      dueSoonCount,
      inTransitAmount,
      avgLeadExpected,
      avgLeadActual,
    };
  }

  async transitList(query: any) {
    const now = new Date();
    const { status, supplierId, from, to, lateOnly, page = '1', pageSize = '20' } = query;
    const where: Prisma.PurchaseWhereInput = {
      status: { in: ['SENT', 'RECEIVED_PARTIAL'] },
    };
    if (status) where.status = status as any;
    if (supplierId) where.supplierId = supplierId;
    if (from || to) {
      where.date = {};
      if (from) (where.date as any).gte = new Date(from);
      if (to) (where.date as any).lte = new Date(to);
    }
    if (lateOnly === 'true') {
      where.expectedDate = { lt: now };
    }
    const skip = (parseInt(page) - 1) * parseInt(pageSize);
    const take = parseInt(pageSize);
    const [list, total] = await this.prisma.$transaction([
      this.prisma.purchase.findMany({
        where,
        include: { supplier: true, items: true, receipts: { include: { items: true } } },
        skip,
        take,
        orderBy: { date: 'asc' },
      }),
      this.prisma.purchase.count({ where }),
    ]);
    const items = list.map(p => {
      const ordered = p.items.reduce((s, it) => s + it.quantity, 0);
      const received = p.receipts.reduce((s, r) => s + r.items.reduce((s2, it) => s2 + it.receivedQty, 0), 0);
      const pct = ordered ? (received / ordered) * 100 : 0;
      const days = p.expectedDate ? Math.ceil((p.expectedDate.getTime() - now.getTime()) / 86400000) : null;
      return {
        id: p.id,
        supplier: p.supplier?.name,
        expectedDate: p.expectedDate,
        daysToDue: days,
        total: p.total,
        status: p.status,
        receivedPct: pct,
      };
    });
    return { total, items };
  }

  receipts(id: string) {
    return this.prisma.goodsReceipt.findMany({
      where: { purchaseId: id },
      include: { items: true },
    });
  }
}
