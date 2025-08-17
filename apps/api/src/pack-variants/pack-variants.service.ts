import { Injectable, BadRequestException, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma.service';
import { CreatePackVariantDto } from './dto/create-pack-variant.dto';
import { UpdatePackVariantDto } from './dto/update-pack-variant.dto';
import PDFDocument from 'pdfkit';
import bwipjs from 'bwip-js';

function mmToPt(mm: number): number {
  return (mm * 72) / 25.4;
}

@Injectable()
export class PackVariantsService {
  constructor(private prisma: PrismaService) {}

  async create(dto: CreatePackVariantDto) {
    const product = await this.prisma.product.findUnique({ where: { id: Number(dto.parentProductId) } });
    if (!product || !product.isBulk) {
      throw new BadRequestException('Producto granel inválido');
    }
    return this.prisma.packVariant.create({ data: { ...dto, parentProductId: Number(dto.parentProductId) } });
  }

  findMany(productId?: string) {
    return this.prisma.packVariant.findMany({
      where: productId ? { parentProductId: Number(productId) } : undefined,
      include: { parentProduct: true },
    });
  }

  async update(id: string, dto: UpdatePackVariantDto) {
    return this.prisma.packVariant.update({ where: { id }, data: dto });
  }

  async findByBarcode(code: string) {
    return this.prisma.packVariant.findUnique({ where: { barcode: code }, include: { parentProduct: true } });
  }

  async label(id: string) {
    const variant = await this.prisma.packVariant.findUnique({ where: { id }, include: { parentProduct: true } });
    if (!variant) throw new NotFoundException();
    const labelWidth = mmToPt(38);
    const labelHeight = mmToPt(20);
    const doc = new PDFDocument({ size: [labelWidth, labelHeight], margin: 0 });
    const buffers: Buffer[] = [];
    doc.on('data', b => buffers.push(b));
    const done = new Promise<Buffer>(resolve => doc.on('end', () => resolve(Buffer.concat(buffers))));
    const fullName = `${variant.parentProduct?.name ?? ''} ${variant.name}`;
    doc.fontSize(8).text(fullName, 2, 2, { width: labelWidth - 4 });
    const price =
      variant.priceMode === 'FIXED' && variant.fixedPrice
        ? Number(variant.fixedPrice)
        : Number(variant.parentProduct?.pricePerKg ?? 0) * Number(variant.contentKg);
    doc.fontSize(12).text(`$${Number(price).toFixed(2)}`, 2, 10);
    if (variant.barcode) {
      const barcode = await bwipjs.toBuffer({ bcid: 'ean13', text: variant.barcode, scale: 2, height: 10 });
      doc.image(barcode, 2, labelHeight - mmToPt(10), { width: labelWidth - 4 });
    }
    doc.fontSize(6).text(new Date().toLocaleDateString(), 2, labelHeight - 8, { width: labelWidth - 4 });
    doc.end();
    return done;
  }
}
