import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma.service';
import { ScaleEncoding } from '@prisma/client';

@Injectable()
export class ScaleService {
  constructor(private prisma: PrismaService) {}

  create(data: { plu: string; productId: number; encoding: ScaleEncoding }) {
    return this.prisma.scalePLU.create({ data });
  }

  findAll() {
    return this.prisma.scalePLU.findMany();
  }

  async parseBarcode(ean13: string) {
    if (!/^2[0-9]{12}$/.test(ean13)) return null;
    const plu = ean13.substring(2, 7);
    const record = await this.prisma.scalePLU.findUnique({ where: { plu } , include:{product:true}});
    if (!record) return null;
    const weightOrPrice = Number(ean13.substring(7,12)) / 1000;
    if (record.encoding === 'WEIGHT_EMBEDDED') {
      return { productId: record.productId, weightKg: weightOrPrice };
    }
    const price = weightOrPrice;
    const weightKg = record.product.pricePerKg ? price / Number(record.product.pricePerKg) : 0;
    return { productId: record.productId, weightKg, price };
  }
}
