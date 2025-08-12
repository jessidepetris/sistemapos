import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma.service';
import { CreateOrderDto } from './dto/create-order.dto';
import { OrderStatus } from '@prisma/client';

@Injectable()
export class OrdersService {
  constructor(private prisma: PrismaService) {}

  create(data: CreateOrderDto) {
    return this.prisma.order.create({
      data: {
        clientId: data.clientId,
        total: data.total,
        notes: data.notes,
        status: data.status ?? OrderStatus.PENDIENTE,
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
    return this.prisma.order.findMany({ include: { items: true } });
  }

  findOne(id: string) {
    return this.prisma.order.findUnique({ where: { id }, include: { items: true } });
  }

  updateStatus(id: string, status: OrderStatus) {
    return this.prisma.order.update({ where: { id }, data: { status } });
  }
}
