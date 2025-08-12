import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma.service';
import { CreateCatalogOrderDto } from './dto/create-catalog-order.dto';
import { Decimal } from '@prisma/client/runtime/library';
import { DeliveryStatus } from '@prisma/client';
import { PromotionsService } from '../promotions/promotions.service';

@Injectable()
export class CatalogService {
  constructor(private prisma: PrismaService, private promotions: PromotionsService) {}

  listProducts() {
    return this.prisma.product.findMany({ where: { stock: { gt: 0 } } });
  }

  async createOrder(dto: CreateCatalogOrderDto) {
    const products = await this.prisma.product.findMany({
      where: { id: { in: dto.items.map((i) => i.productId) } },
    });

    const itemData = dto.items.map((i) => {
      const product = products.find((p) => p.id === i.productId);
      const price = product ? product.priceARS : new Decimal(0);
      return {
        productId: i.productId,
        quantity: i.quantity,
        price,
        discount: new Decimal(0),
      };
    });

    const promo = await this.promotions.applyPromotions(
      itemData.map(i => ({
        productId: i.productId,
        quantity: i.quantity,
        price: i.price.toNumber(),
        discount: i.discount.toNumber(),
      })),
    );

    // sync updated discounts back
    promo.items.forEach(p => {
      const item = itemData.find(i => i.productId === p.productId);
      if (item) item.discount = new Decimal(p.discount || 0);
    });

    const subtotal = itemData.reduce(
      (sum, i) => sum + i.price.toNumber() * i.quantity - i.discount.toNumber(),
      0,
    );
    const total = subtotal - promo.discount;

    const quotation = await this.prisma.quotation.create({
      data: {
        clientId: dto.clientId,
        status: 'PENDIENTE',
        total: new Decimal(total),
        items: { create: itemData },
      },
      include: { items: true },
    });

    await this.prisma.delivery.create({
      data: {
        quotationId: quotation.id,
        status: DeliveryStatus.PREPARANDO,
      },
    });

    return quotation;
  }

  getClientOrders(clientId: number) {
    return this.prisma.quotation.findMany({
      where: { clientId },
      include: { items: true, delivery: true },
      orderBy: { createdAt: 'desc' },
    });
  }
}
