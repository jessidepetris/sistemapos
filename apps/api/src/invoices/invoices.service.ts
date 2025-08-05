import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma.service';
import PDFDocument from 'pdfkit';
import * as fs from 'fs';
import { join } from 'path';
import Afip from '@afipsdk/afip.js';

@Injectable()
export class InvoicesService {
  constructor(private prisma: PrismaService) {}

  async generate(saleId: string) {
    const sale = await this.prisma.sale.findUnique({
      where: { id: saleId },
      include: { items: true, customer: true },
    });
    if (!sale) throw new NotFoundException('Sale not found');

    const pointOfSale = Number(process.env.AFIP_POS || 1);
    let cae = '00000000000000';
    let caeExpiration = new Date();
    let number = 1;

    try {
      const afip = new Afip({
        CUIT: Number(process.env.AFIP_CUIT),
        cert: process.env.AFIP_CERT_PATH,
        key: process.env.AFIP_KEY_PATH,
        production: process.env.AFIP_PROD === 'true',
      });
      const voucherType = 11; // Factura C
      const last = await afip.ElectronicBilling.getLastVoucher(pointOfSale, voucherType);
      number = last + 1;
      const data = {
        CantReg: 1,
        PtoVta: pointOfSale,
        CbteTipo: voucherType,
        Concepto: 1,
        DocTipo: 99,
        DocNro: 0,
        CbteDesde: number,
        CbteHasta: number,
        CbteFch: Number(new Date().toISOString().slice(0,10).replace(/-/g,'')),
        ImpTotal: Number(sale.total),
        ImpTotConc: 0,
        ImpNeto: Number(sale.total),
        ImpOpEx: 0,
        ImpIVA: 0,
        ImpTrib: 0,
        MonId: 'PES',
        MonCotiz: 1,
      };
      const res = await afip.ElectronicBilling.createVoucher(data);
      cae = res.CAE;
      const fch = res.CAEFchVto; // YYYYMMDD
      caeExpiration = new Date(`${fch.slice(0,4)}-${fch.slice(4,6)}-${fch.slice(6,8)}`);
    } catch (e) {
      caeExpiration = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000);
    }

    const invoice = await this.prisma.invoice.create({
      data: {
        saleId,
        cae,
        caeExpiration,
        pointOfSale,
        number,
        type: 'Factura C',
        clientName: sale.customerName,
        clientCuit: null,
        totalAmount: sale.total,
        pdfUrl: '',
      },
    });

    const pdfUrl = `/invoices/${invoice.id}/pdf`;
    await this.prisma.invoice.update({ where: { id: invoice.id }, data: { pdfUrl } });

    const pdf = await this.generatePdf(invoice, sale);
    const dir = join(process.cwd(), 'invoices');
    await fs.promises.mkdir(dir, { recursive: true });
    await fs.promises.writeFile(join(dir, `${invoice.id}.pdf`), pdf);

    return { ...invoice, pdfUrl };
  }

  async generatePdf(invoice: any, sale: any): Promise<Buffer> {
    const doc = new PDFDocument();
    const chunks: Buffer[] = [];
    doc.on('data', chunk => chunks.push(chunk as Buffer));
    return new Promise(resolve => {
      doc.on('end', () => resolve(Buffer.concat(chunks)));
      doc.fontSize(16).text('Factura C');
      doc.text(`Cliente: ${invoice.clientName}`);
      doc.text(`CAE: ${invoice.cae}`);
      doc.text(`Vto CAE: ${invoice.caeExpiration.toISOString().slice(0,10)}`);
      doc.moveDown();
      sale.items.forEach(item => {
        doc.text(`Producto ${item.productId} x${item.quantity} - $${item.price}`);
      });
      doc.moveDown();
      doc.text(`Total: $${sale.total}`);
      doc.end();
    });
  }

  async getPdf(id: string): Promise<Buffer> {
    const file = join(process.cwd(), 'invoices', `${id}.pdf`);
    return fs.promises.readFile(file);
  }
}
