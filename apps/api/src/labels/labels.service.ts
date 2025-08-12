import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma.service';
import PDFDocument from 'pdfkit';
import bwipjs from 'bwip-js';
import { PrintLabelsDto } from './dto/print-labels.dto';
import { PrintPackVariantsDto } from './dto/print-pack-variants.dto';
import { ScaleEncoding } from '@prisma/client';
import { ScaleFakeService } from '../scale-fake/scale-fake.service';

function mmToPt(mm: number): number {
  return (mm * 72) / 25.4;
}

@Injectable()
export class LabelsService {
  constructor(
    private prisma: PrismaService,
    private scaleFake: ScaleFakeService,
  ) {}

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

  async renderMinLabelPDF(items: Array<{ description: string; ean13: string; copies: number }>, settings?: {
    widthMm?: number;
    heightMm?: number;
    gutterMm?: number;
    fontSizePt?: number;
    barcodeHeightMm?: number;
    columns?: number;
  }): Promise<Buffer> {
    const width = mmToPt(settings?.widthMm ?? 38);
    const height = mmToPt(settings?.heightMm ?? 20);
    const gutter = mmToPt(settings?.gutterMm ?? 2);
    const columns = settings?.columns ?? 2;
    const fontSize = settings?.fontSizePt ?? 9;
    const barcodeHeight = settings?.barcodeHeightMm ?? 10;
    const totalCopies = items.reduce((s, i) => s + i.copies, 0);
    const rows = Math.ceil(totalCopies / columns);
    const doc = new PDFDocument({ size: [width * columns + gutter * (columns - 1), height * rows], margin: 0 });
    const buffers: Buffer[] = [];
    doc.on('data', (b) => buffers.push(b));
    const done = new Promise<Buffer>((resolve) => doc.on('end', () => resolve(Buffer.concat(buffers))));
    let idx = 0;
    for (const item of items) {
      for (let c = 0; c < item.copies; c++) {
        const row = Math.floor(idx / columns);
        const col = idx % columns;
        const x = col * (width + gutter);
        const y = row * height;
        doc.fontSize(fontSize).text(item.description, x + 2, y + 2, { width: width - 4, align: 'center' });
        const barcode = await bwipjs.toBuffer({ bcid: 'ean13', text: item.ean13, scale: 2, height: barcodeHeight });
        doc.image(barcode, x + 2, y + height - mmToPt(barcodeHeight), { width: width - 4 });
        idx++;
      }
    }
    doc.end();
    return done;
  }

  async printPackVariantLabels(dto: PrintPackVariantsDto): Promise<Buffer> {
    const settings = await this.prisma.systemSetting.findFirst();
    const items: Array<{ description: string; ean13: string; copies: number }> = [];
    for (const v of dto.variants) {
      const variant = await this.prisma.packVariant.findUnique({
        where: { id: v.variantId },
        include: { parentProduct: true },
      });
      if (!variant) continue;
      let ean = variant.barcode || variant.fakeScaleBarcode;
      if (!ean && (dto.forceFakeIfMissing || settings?.labelsAllowFakeScaleIfMissingBarcode)) {
        const base12 = this.scaleFake.buildBase12({
          prefix: settings?.scaleCodesDefaultPrefix ?? 20,
          scheme: settings?.scaleCodesDefaultScheme as ScaleEncoding ?? 'WEIGHT_EMBEDDED',
          contentKg: Number(variant.contentKg),
        });
        ean = this.scaleFake.toEAN13(base12);
      }
      if (!ean) continue;
      const description = `${variant.parentProduct.name} ${variant.name}`.slice(0, 36);
      items.push({ description, ean13: ean, copies: v.copies });
    }
    return this.renderMinLabelPDF(items, {
      widthMm: settings?.labelsSizeWidthMm,
      heightMm: settings?.labelsSizeHeightMm,
      gutterMm: settings?.labelsGutterMm,
      fontSizePt: settings?.labelsFontSizeTitlePt,
      barcodeHeightMm: settings?.labelsBarcodeHeightMm,
      columns: settings?.labelsTwoBands ? 2 : 1,
    });
  }
}
