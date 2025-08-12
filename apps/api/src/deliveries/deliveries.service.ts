import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma.service';
import { CreateDeliveryDto } from './dto/create-delivery.dto';
import { DeliveryStatus, AuditActionType } from '@prisma/client';
import { AuditService } from '../audit/audit.service';

@Injectable()
export class DeliveriesService {
  constructor(
    private prisma: PrismaService,
    private audit: AuditService,
  ) {}

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

  async updateStatus(id: string, status: DeliveryStatus, user?: { id: string; email: string }) {
    const delivery = await this.prisma.delivery.update({ where: { id }, data: { status } });
    await this.audit.log({
      userId: user?.id ?? 'unknown',
      userEmail: user?.email ?? 'unknown',
      actionType: AuditActionType.CAMBIO_ESTADO,
      entity: 'Delivery',
      entityId: id,
      details: `Estado cambiado a ${status}`,
    });
    return delivery;
  }
}
