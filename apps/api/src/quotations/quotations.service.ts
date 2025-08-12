import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma.service';
import { CreateQuotationDto } from './dto/create-quotation.dto';
import { QuotationStatus } from '@prisma/client';

@Injectable()
export class QuotationsService {
  constructor(private prisma: PrismaService) {}

  create(data: CreateQuotationDto) {
    return this.prisma.quotation.create({
      data: {
        clientId: data.clientId,
        total: data.total,
        notes: data.notes,
        status: QuotationStatus.PENDIENTE,
        items: {
          create: data.items.map(item => ({
            productId: item.productId,
            quantity: item.quantity,
            price: item.price,
            discount: item.discount,
          })),
        },
      },
      include: { items: true },
    });
  }

  findAll() {
    return this.prisma.quotation.findMany({ include: { items: true } });
  }

  findOne(id: string) {
    return this.prisma.quotation.findUnique({ where: { id }, include: { items: true } });
  }

  updateStatus(id: string, status: QuotationStatus) {
    return this.prisma.quotation.update({ where: { id }, data: { status } });
  }
}
