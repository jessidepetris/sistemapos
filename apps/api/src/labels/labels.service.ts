import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma.service';
import PDFDocument from 'pdfkit';
import bwipjs from 'bwip-js';
import { PrintLabelsDto } from './dto/print-labels.dto';

function mmToPt(mm: number): number {
  return (mm * 72) / 25.4;
}

@Injectable()
export class LabelsService {
  constructor(private prisma: PrismaService) {}

  async generatePdf(dto: PrintLabelsDto): Promise<Buffer> {
    const columns = dto.columns && dto.columns > 0 ? dto.columns : 2;
    const labelWidth = mmToPt(38);
    const labelHeight = mmToPt(20);
    const items: { product: any; quantity: number; barcode: Buffer }[] = [];
    for (const it of dto.items) {
      const product = await this.prisma.product.findUnique({
        where: { id: it.productId },
      });
      if (!product) continue;
      const code = (product.barcodes && product.barcodes[0])
        ? product.barcodes[0]
        : String(product.id).padStart(13, '0');
      const barcode = await bwipjs.toBuffer({
        bcid: 'ean13',
        text: code,
        scale: 2,
        height: 10,
      });
      items.push({ product, quantity: it.quantity, barcode });
    }
    const total = items.reduce((sum, i) => sum + i.quantity, 0);
    const rows = Math.ceil(total / columns);
    const doc = new PDFDocument({
      size: [labelWidth * columns, labelHeight * rows],
      margin: 0,
    });
    const buffers: Buffer[] = [];
    doc.on('data', (b) => buffers.push(b));
    const done = new Promise<Buffer>((resolve) => {
      doc.on('end', () => resolve(Buffer.concat(buffers)));
    });

    const today = new Date().toLocaleDateString();
    let index = 0;
    for (const item of items) {
      for (let i = 0; i < item.quantity; i++) {
        const row = Math.floor(index / columns);
        const col = index % columns;
        const x = col * labelWidth;
        const y = row * labelHeight;
        doc.fontSize(8).text(item.product.name, x + 2, y + 2, {
          width: labelWidth - 4,
        });
        const price = Number(item.product.priceARS);
        doc.fontSize(12).text(`$${price.toFixed(2)}`, x + 2, y + 10, {
          width: labelWidth - 4,
        });
        doc.image(item.barcode, x + 2, y + labelHeight - mmToPt(10), {
          width: labelWidth - 4,
        });
        doc.fontSize(6).text(today, x + 2, y + labelHeight - 8, {
          width: labelWidth - 4,
        });
        index++;
      }
    }

    doc.end();
    return done;
  }
}
