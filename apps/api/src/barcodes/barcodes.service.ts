import { Injectable, BadRequestException } from '@nestjs/common';
import { PrismaService } from '../prisma.service';
import { LabelsService } from '../labels/labels.service';
import { ScaleFakeService } from '../scale-fake/scale-fake.service';
import { ScaleEncoding } from '@prisma/client';
import { promises as fs } from 'fs';
import path from 'path';

@Injectable()
export class BarcodesService {
  constructor(
    private prisma: PrismaService,
    private labels: LabelsService,
    private scaleFake: ScaleFakeService,
  ) {}

  computeCheckDigit(base12: string) {
    const digits = base12.split('').map(Number);
    const sum = digits.reduce((acc, d, idx) => acc + d * (idx % 2 === 0 ? 1 : 3), 0);
    const mod = sum % 10;
    return mod === 0 ? 0 : 10 - mod;
  }

  validateEAN13(ean13: string) {
    if (!/^\d{13}$/.test(ean13)) return false;
    const check = Number(ean13[ean13.length - 1]);
    return this.computeCheckDigit(ean13.slice(0, 12)) === check;
  }

  async allocateInternalCodes(count: number, notes?: string) {
    const settings = await this.prisma.systemSetting.findFirst();
    if (!settings) throw new BadRequestException('settings missing');
    let seq = settings.barcodesNextSequence;
    const prefix = settings.barcodesInternalPrefix2;
    const data = [] as { ean13: string; notes?: string }[];
    for (let i = 0; i < count; i++) {
      const base = `${prefix}${(seq + i).toString().padStart(8, '0')}`;
      const ean13 = base + this.computeCheckDigit(base);
      data.push({ ean13, notes });
    }
    await this.prisma.$transaction([
      this.prisma.internalBarcode.createMany({ data }),
      this.prisma.systemSetting.update({ where: { id: 1 }, data: { barcodesNextSequence: seq + count } }),
    ]);
    return data.map((d) => d.ean13);
  }

  async assignInternal(variantId: string) {
    const variant = await this.prisma.packVariant.findUnique({ where: { id: variantId } });
    if (!variant) throw new BadRequestException('variant not found');
    if (variant.barcode || variant.fakeScaleBarcode) {
      throw new BadRequestException('variant already has barcode');
    }
    const code = await this.prisma.$transaction(async (tx) => {
      const b = await tx.internalBarcode.findFirst({ where: { status: 'FREE' }, orderBy: { createdAt: 'asc' } });
      if (!b) throw new BadRequestException('no free barcodes');
      await tx.internalBarcode.update({ where: { id: b.id }, data: { status: 'ASSIGNED', variantId, assignedAt: new Date() } });
      await tx.packVariant.update({ where: { id: variantId }, data: { barcode: b.ean13 } });
      return b.ean13;
    });
    return { ean13: code };
  }

  async assignFake(variantId: string, opts: { scheme?: ScaleEncoding; prefix?: number; priceArs?: number; unitPriceArs?: number }) {
    const res = await this.scaleFake.generateForVariant(variantId, {
      scheme: opts.scheme,
      prefix: opts.prefix,
      priceArs: opts.priceArs,
      unitPriceArs: opts.unitPriceArs,
      persist: true,
    });
    return { ean13: res.ean13 };
  }

  async assignAndPrint(opts: { variantId: string; type: 'INTERNAL' | 'FAKE'; copies?: number; print?: boolean; fake?: any }) {
    let ean13: string;
    if (opts.type === 'INTERNAL') {
      ({ ean13 } = await this.assignInternal(opts.variantId));
    } else {
      ({ ean13 } = await this.assignFake(opts.variantId, opts.fake || {}));
    }
    let pdfUrl: string | undefined;
    if (opts.print) {
      const variant = await this.prisma.packVariant.findUnique({ where: { id: opts.variantId }, include: { parentProduct: true } });
      if (variant) {
        const description = `${variant.parentProduct.name} ${variant.name}`.slice(0, 36);
        const pdf = await this.labels.renderMinLabelPDF([{ description, ean13, copies: opts.copies ?? 1 }]);
        const dir = path.join(process.cwd(), 'labels');
        await fs.mkdir(dir, { recursive: true });
        const file = path.join(dir, `variant-${ean13}.pdf`);
        await fs.writeFile(file, pdf);
        pdfUrl = `/labels/variant-${ean13}.pdf`;
      }
    }
    return { ean13, pdfUrl };
  }

  async release(ean13: string, retire = false) {
    const code = await this.prisma.internalBarcode.findUnique({ where: { ean13 } });
    if (!code) throw new BadRequestException('barcode not found');
    if (code.variantId) {
      await this.prisma.packVariant.update({ where: { id: code.variantId }, data: { barcode: null } });
    }
    await this.prisma.internalBarcode.update({
      where: { ean13 },
      data: { status: retire ? 'RETIRED' : 'FREE', variantId: null },
    });
  }
}
