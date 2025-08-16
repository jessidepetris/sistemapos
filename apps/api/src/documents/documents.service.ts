import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma.service';
import PDFDocument from 'pdfkit';

@Injectable()
export class DocumentsService {
  constructor(private prisma: PrismaService) {}

  async invoice(id: string) {
    const invoice = await this.prisma.invoice.findUnique({
      where: { id },
      include: { sale: { include: { items: true } } },
    });
    if (!invoice || !invoice.sale) return null;
    return this.salePdf('Factura C', invoice.sale, {
      number: invoice.cbteNro,
      cae: invoice.cae,
      caeVto: invoice.caeExpiry,
    });
  }

  async remito(id: string) {
    const sale = await this.prisma.sale.findUnique({
      where: { id },
      include: { items: true },
    });
    if (!sale) return null;
    return this.salePdf('Remito X', sale);
  }

  async order(id: string) {
    const order = await this.prisma.order.findUnique({
      where: { id },
      include: { items: true, client: true },
    });
    if (!order) return null;
    return this.itemsPdf('Nota de pedido', {
      createdAt: order.createdAt,
      customerName: order.client?.name || 'Consumidor Final',
      items: order.items,
      total: order.total,
    });
  }

  async quotation(id: string) {
    const quotation = await this.prisma.quotation.findUnique({
      where: { id },
      include: { items: true, client: true },
    });
    if (!quotation) return null;
    return this.itemsPdf('Presupuesto', {
      createdAt: quotation.createdAt,
      customerName: quotation.client?.name || 'Consumidor Final',
      items: quotation.items,
      total: quotation.total,
    });
  }

  async credit(id: string) {
    const sale = await this.prisma.sale.findUnique({
      where: { id },
      include: { items: true },
    });
    if (!sale) return null;
    return this.salePdf('Nota de crédito', sale);
  }

  async debit(id: string) {
    const sale = await this.prisma.sale.findUnique({
      where: { id },
      include: { items: true },
    });
    if (!sale) return null;
    return this.salePdf('Nota de débito', sale);
  }

  async change(id: string) {
    const sale = await this.prisma.sale.findUnique({
      where: { id },
      include: { items: true },
    });
    if (!sale) return null;
    return this.salePdf('Nota de cambio', sale);
  }

  private salePdf(title: string, sale: any, extra: any = {}) {
    const doc = new PDFDocument({ size: 'A4', margin: 50 });
    const chunks: Buffer[] = [];
    doc.on('data', chunk => chunks.push(chunk as Buffer));
    return new Promise<Buffer>(resolve => {
      doc.on('end', () => resolve(Buffer.concat(chunks)));
      doc.fontSize(20).text('Punto Pastelero', { align: 'center' });
      doc.moveDown();
      doc.fontSize(16).text(title, { align: 'center' });
      doc.moveDown();
      doc.fontSize(12).text(`Fecha: ${new Date(sale.createdAt).toLocaleString()}`);
      doc.text(`Cliente: ${sale.customerName}`);
      if (extra.number) doc.text(`Número: ${extra.number}`);
      if (extra.cae) doc.text(`CAE: ${extra.cae}`);
      if (extra.caeVto) doc.text(`Vto CAE: ${new Date(extra.caeVto).toISOString().slice(0,10)}`);
      doc.moveDown();
      sale.items.forEach((item: any) => {
        doc.text(`Producto ${item.productId} x${item.quantity} - $${item.price}`);
      });
      doc.moveDown();
      doc.text(`Subtotal: $${sale.subtotal}`);
      doc.text(`Descuento: $${sale.discount}`);
      doc.text(`Total: $${sale.total}`);
      doc.end();
    });
  }

  private itemsPdf(title: string, data: any) {
    const doc = new PDFDocument({ size: 'A4', margin: 50 });
    const chunks: Buffer[] = [];
    doc.on('data', chunk => chunks.push(chunk as Buffer));
    return new Promise<Buffer>(resolve => {
      doc.on('end', () => resolve(Buffer.concat(chunks)));
      doc.fontSize(20).text('Punto Pastelero', { align: 'center' });
      doc.moveDown();
      doc.fontSize(16).text(title, { align: 'center' });
      doc.moveDown();
      doc.fontSize(12).text(`Fecha: ${new Date(data.createdAt).toLocaleString()}`);
      doc.text(`Cliente: ${data.customerName}`);
      doc.moveDown();
      data.items.forEach((item: any) => {
        doc.text(`Producto ${item.productId} x${item.quantity} - $${item.price}`);
      });
      doc.moveDown();
      doc.text(`Total: $${data.total}`);
      doc.end();
    });
  }
}

