import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma.service';
import { CreateSupplierDto } from './dto/create-supplier.dto';

@Injectable()
export class SuppliersService {
  constructor(private prisma: PrismaService) {}

  create(data: CreateSupplierDto) {
    return this.prisma.supplier.create({ data });
  }

  async findAll() {
    const suppliers = await this.prisma.supplier.findMany({
      include: { purchases: true },
    });
    return suppliers.map(s => {
      const debt = s.purchases.reduce(
        (acc, p) => acc + Number(p.total) - Number(p.paidAmount),
        0,
      );
      return { ...s, debt };
    });
  }

  findOne(id: string) {
    return this.prisma.supplier.findUnique({
      where: { id },
      include: {
        purchases: { include: { items: true, payments: true } },
        payments: true,
      },
    });
  }

  getLeadTimes() {
    return this.prisma.supplierLeadTime.findMany();
  }

  upsertLeadTime(data: any) {
    return this.prisma.supplierLeadTime.upsert({
      where: { id: data.id ?? '' },
      create: data,
      update: data,
    });
  }
}
