import { Injectable, BadRequestException } from '@nestjs/common';
import { PrismaService } from '../prisma.service';
import bwipjs from 'bwip-js';
import PDFDocument from 'pdfkit';
import { ScaleEncoding } from '@prisma/client';
import { promises as fs } from 'fs';
import path from 'path';
import AdmZip from 'adm-zip';
import Papa from 'papaparse';

function mmToPt(mm: number): number {
  return (mm * 72) / 25.4;
}

@Injectable()
export class ScaleFakeService {
  constructor(private prisma: PrismaService) {}

  buildBase12(opts: { prefix: number; scheme: ScaleEncoding; contentKg?: number; priceArs?: number; unitPriceArs?: number }) {
    const { prefix, scheme, contentKg, priceArs, unitPriceArs } = opts;
    if (prefix < 20 || prefix > 29) {
      throw new BadRequestException('Prefix must be 20-29');
    }
    let value5: string;
    if (scheme === 'WEIGHT_EMBEDDED') {
      if (contentKg === undefined) throw new BadRequestException('contentKg required');
      value5 = Math.round(contentKg * 1000).toString().padStart(5, '0');
    } else {
      let price = priceArs;
      if (price == null && unitPriceArs != null && contentKg != null) {
        price = unitPriceArs * contentKg;
      }
      if (price == null) throw new BadRequestException('priceArs or unitPriceArs required');
      value5 = Math.round(price * 100).toString().padStart(5, '0');
    }
    return `${prefix.toString().padStart(2, '0')}00000${value5}`;
  }

  computeCheckDigit(base12: string) {
    const digits = base12.split('').map(Number);
    const sum = digits.reduce((acc, d, idx) => acc + d * (idx % 2 === 0 ? 1 : 3), 0);
    const mod = sum % 10;
    return mod === 0 ? 0 : 10 - mod;
  }

  toEAN13(base12: string) {
    return base12 + this.computeCheckDigit(base12);
  }

  async renderPng(ean13: string): Promise<string> {
    const png = await bwipjs.toBuffer({ bcid: 'ean13', text: ean13, scale: 2, height: 10, includetext: true });
    return png.toString('base64');
  }

  private async renderLabelsPdf(items: Array<{ title: string; ean13: string; copies: number }>): Promise<Buffer> {
    const width = mmToPt(38);
    const height = mmToPt(20);
    const gutter = mmToPt(2);
    const columns = 2;
    const barcodeHeight = 10;
    const total = items.reduce((s, i) => s + i.copies, 0);
    const rows = Math.ceil(total / columns);
    const doc = new PDFDocument({ size: [width * columns + gutter, height * rows], margin: 0 });
    const bufs: Buffer[] = [];
    doc.on('data', (b) => bufs.push(b));
    const done = new Promise<Buffer>((resolve) => doc.on('end', () => resolve(Buffer.concat(bufs))));
    let idx = 0;
    for (const it of items) {
      for (let c = 0; c < it.copies; c++) {
        const row = Math.floor(idx / columns);
        const col = idx % columns;
        const x = col * (width + gutter);
        const y = row * height;
        doc.fontSize(9).text(it.title, x + 2, y + 2, { width: width - 4, align: 'center' });
        const barcode = await bwipjs.toBuffer({ bcid: 'ean13', text: it.ean13, scale: 2, height: barcodeHeight });
        doc.image(barcode, x + 2, y + height - mmToPt(barcodeHeight), { width: width - 4 });
        idx++;
      }
    }
    doc.end();
    return done;
  }

  private async generateItem(variantId: string, opts: { scheme: ScaleEncoding; prefix: number; priceArs?: number; unitPriceArs?: number; title: string; copies: number }) {
    const variant = await this.prisma.packVariant.findUnique({
      where: { id: variantId },
      include: { parentProduct: true },
    });
    if (!variant) throw new BadRequestException('Variant not found');
    const base12 = this.buildBase12({
      prefix: opts.prefix,
      scheme: opts.scheme,
      contentKg: Number(variant.contentKg),
      priceArs: opts.priceArs,
      unitPriceArs: opts.unitPriceArs,
    });
    const ean13 = this.toEAN13(base12);
    const pngBuffer = Buffer.from(await this.renderPng(ean13), 'base64');
    const pdfBuffer = await this.renderLabelsPdf([{ title: opts.title, ean13, copies: opts.copies }]);
    return { ean13, pngBuffer, pdfBuffer, base12, variant };
  }

  async generateForVariant(variantId: string, opts: { scheme?: ScaleEncoding; prefix?: number; priceArs?: number; unitPriceArs?: number; persist?: boolean; copies?: number; titleOverride?: string; makePdf?: boolean }) {
    const settings = await this.prisma.systemSetting.findFirst();
    const scheme = opts.scheme || settings?.scaleCodesDefaultScheme || 'WEIGHT_EMBEDDED';
    const prefix = opts.prefix || settings?.scaleCodesDefaultPrefix || 20;
    const copies = opts.copies ?? 1;
    const title = (opts.titleOverride || '').trim();
    const res = await this.generateItem(variantId, {
      scheme,
      prefix,
      priceArs: opts.priceArs,
      unitPriceArs: opts.unitPriceArs,
      title: title || (await this.prisma.packVariant.findUnique({ where: { id: variantId } }))!.name,
      copies,
    });
    if (opts.persist) {
      await this.prisma.packVariant.update({
        where: { id: variantId },
        data: { fakeScaleBarcode: res.ean13, fakeScaleScheme: scheme, fakeScalePrefix: prefix },
      });
    }
    let pdfUrl: string | undefined;
    if (opts.makePdf) {
      const dir = path.join(process.cwd(), 'labels');
      await fs.mkdir(dir, { recursive: true });
      const file = path.join(dir, `scale-${res.ean13}.pdf`);
      await fs.writeFile(file, res.pdfBuffer);
      pdfUrl = `/labels/scale-${res.ean13}.pdf`;
    }
    return { ean13: res.ean13, pngBase64: res.pngBuffer.toString('base64'), pdfUrl };
  }

  async generateBatch(items: Array<{ variantId: string; scheme?: ScaleEncoding; prefix?: number; priceArs?: number; unitPriceArs?: number; copies?: number; titleOverride?: string }>, opts: { persist?: boolean; zip?: boolean }) {
    const results: any[] = [];
    const zip = new AdmZip();
    const csvRows: any[] = [];
    for (const it of items) {
      const settings = await this.prisma.systemSetting.findFirst();
      const scheme = it.scheme || settings?.scaleCodesDefaultScheme || 'WEIGHT_EMBEDDED';
      const prefix = it.prefix || settings?.scaleCodesDefaultPrefix || 20;
      const copies = it.copies ?? 1;
      const variant = await this.prisma.packVariant.findUnique({ where: { id: it.variantId }, include: { parentProduct: true } });
      if (!variant) continue;
      const title = (it.titleOverride || `${variant.parentProduct.name} ${variant.name}`).slice(0, 36);
      const gen = await this.generateItem(it.variantId, { scheme, prefix, priceArs: it.priceArs, unitPriceArs: it.unitPriceArs, title, copies });
      if (opts.persist) {
        await this.prisma.packVariant.update({ where: { id: it.variantId }, data: { fakeScaleBarcode: gen.ean13, fakeScaleScheme: scheme, fakeScalePrefix: prefix } });
      }
      if (opts.zip) {
        zip.addFile(`label-${gen.ean13}.png`, gen.pngBuffer);
        zip.addFile(`label-${gen.ean13}.pdf`, gen.pdfBuffer);
        csvRows.push({ variantId: it.variantId, title, ean13: gen.ean13, scheme, prefix, contentKg: Number(variant.contentKg), priceArs: it.priceArs, copies });
      }
      results.push({ variantId: it.variantId, ean13: gen.ean13 });
    }
    if (opts.zip) {
      const csv = Papa.unparse(csvRows, { header: true });
      const csvBuf = Buffer.from(csv);
      zip.addFile('summary.csv', csvBuf);
      const dir = path.join(process.cwd(), 'labels');
      await fs.mkdir(dir, { recursive: true });
      const file = path.join(dir, `scale-batch-${Date.now()}.zip`);
      await zip.writeZip(file);
      return { zipUrl: `/labels/${path.basename(file)}` };
    }
    return { items: results };
  }

  async reprint(variants: Array<{ variantId: string; copies: number }>, use: 'fake' | 'barcode' = 'fake') {
    const items: Array<{ title: string; ean13: string; copies: number }> = [];
    for (const v of variants) {
      const variant = await this.prisma.packVariant.findUnique({ where: { id: v.variantId }, include: { parentProduct: true } });
      if (!variant) continue;
      const code = use === 'fake' ? variant.fakeScaleBarcode : variant.barcode;
      if (!code) continue;
      const title = `${variant.parentProduct.name} ${variant.name}`.slice(0, 36);
      items.push({ title, ean13: code, copies: v.copies });
    }
    const pdf = await this.renderLabelsPdf(items);
    const dir = path.join(process.cwd(), 'labels');
    await fs.mkdir(dir, { recursive: true });
    const file = path.join(dir, `reprint-${Date.now()}.pdf`);
    await fs.writeFile(file, pdf);
    return { pdfUrl: `/labels/${path.basename(file)}` };
  }
}
