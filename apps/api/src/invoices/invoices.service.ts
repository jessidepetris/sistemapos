import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma.service';
import { DocumentsService } from '../documents/documents.service';
import { AfipQueueService } from '../afip/afip.queue.service';
import { AuditService } from '../audit/audit.service';
import { AuditActionType, AfipDocType } from '@prisma/client';

@Injectable()
export class InvoicesService {
  constructor(
    private prisma: PrismaService,
    private docs: DocumentsService,
    private afipQueue: AfipQueueService,
    private audit: AuditService,
  ) {}

  async createAfipInvoice(saleId: string) {
    const existing = await this.prisma.invoice.findUnique({ where: { saleId } });
    if (existing?.cae) return existing;
    const sale = await this.prisma.sale.findUnique({
      where: { id: saleId },
      include: { items: true, customer: true },
    });
    if (!sale) throw new NotFoundException('Sale not found');
    await this.audit.log({
      userId: sale.customerId ? String(sale.customerId) : 'unknown',
      userEmail: '',
      actionType: AuditActionType.FACTURACION_INTENT,
      entity: 'Sale',
      entityId: saleId,
      details: 'Intento de facturación AFIP',
    });
    const invoice = await this.prisma.invoice.upsert({
      where: { saleId },
      create: {
        saleId,
        docType: 'FC',
        ptoVta: Number(process.env.AFIP_PTO_VTA) || 1,
        pdfUrl: `/documents/invoice/${saleId}/pdf`,
      },
      update: { pdfUrl: `/documents/invoice/${saleId}/pdf` },
    });
    await this.afipQueue.enqueue(saleId);
    return invoice;
  }

  retryAfip(saleId: string) {
    return this.afipQueue.enqueue(saleId);
  }

  async status(saleId: string) {
    const inv = await this.prisma.invoice.findUnique({ where: { saleId } });
    return {
      hasCAE: Boolean(inv?.cae),
      afipNumber: inv?.cbteNro,
      cae: inv?.cae,
      caeVto: inv?.caeExpiry,
      error: inv?.lastError,
    };
  }

  async generateRemito(saleId: string) {
    const invoice = await this.prisma.invoice.upsert({
      where: { saleId },
      create: {
        saleId,
        docType: AfipDocType.RC,
        pdfUrl: `/documents/remito/${saleId}/pdf`,
      },
      update: { docType: AfipDocType.RC, pdfUrl: `/documents/remito/${saleId}/pdf` },
    });
    await this.audit.log({
      userId: String(saleId),
      userEmail: '',
      actionType: AuditActionType.REMITO_X_CREATE,
      entity: 'Invoice',
      entityId: invoice.id,
      details: `Remito X para venta ${saleId}`,
    });
    return invoice;
  }

  async getPdf(id: string) {
    const invoice = await this.prisma.invoice.findUnique({ where: { id } });
    if (!invoice) throw new NotFoundException('Invoice not found');
    if (invoice.docType === AfipDocType.RC) {
      return this.docs.remito(invoice.saleId);
    }
    return this.docs.invoice(id);
  }
}
