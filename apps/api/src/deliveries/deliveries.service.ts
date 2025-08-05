import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma.service';
import { CreateDeliveryDto } from './dto/create-delivery.dto';
import { DeliveryStatus } from '@prisma/client';

@Injectable()
export class DeliveriesService {
  constructor(private prisma: PrismaService) {}

  create(data: CreateDeliveryDto) {
    return this.prisma.delivery.create({
      data: {
        quotationId: data.quotationId,
        status: data.status ?? DeliveryStatus.PREPARANDO,
        assignedTo: data.assignedTo,
        notes: data.notes,
      },
    });
  }

  findAll() {
    return this.prisma.delivery.findMany({ include: { quotation: true } });
  }

  findOne(id: string) {
    return this.prisma.delivery.findUnique({ where: { id }, include: { quotation: true } });
  }

  updateStatus(id: string, status: DeliveryStatus) {
    return this.prisma.delivery.update({ where: { id }, data: { status } });
  }
}
