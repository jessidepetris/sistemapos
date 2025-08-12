import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma.service';
import { CreatePromotionDto } from './dto/create-promotion.dto';
import { UpdatePromotionDto } from './dto/update-promotion.dto';

interface ItemInput {
  productId: number;
  quantity: number;
  price: number;
  discount?: number;
}

@Injectable()
export class PromotionsService {
  constructor(private prisma: PrismaService) {}

  create(data: CreatePromotionDto) {
    return this.prisma.promotion.create({ data });
  }

  findAll() {
    return this.prisma.promotion.findMany();
  }

  update(id: string, data: UpdatePromotionDto) {
    return this.prisma.promotion.update({ where: { id }, data });
  }

  getActive(clientType?: string) {
    const now = new Date();
    return this.prisma.promotion.findMany({
      where: {
        active: true,
        validFrom: { lte: now },
        validTo: { gte: now },
        ...(clientType ? { OR: [{ clientType }, { clientType: null }] } : {}),
      },
    });
  }

  async applyPromotions(items: ItemInput[], clientType?: string) {
    const promos = await this.getActive(clientType);
    if (!promos.length) return { items, discount: 0 };

    const productIds = items.map(i => i.productId);
    const products = await this.prisma.product.findMany({
      where: { id: { in: productIds } },
      select: { id: true, category: true },
    });

    let extraDiscount = 0;

    for (const promo of promos) {
      for (const item of items) {
        const product = products.find(p => p.id === item.productId);
        if (promo.productId && promo.productId !== item.productId) continue;
        if (promo.categoryId && product?.category !== promo.categoryId) continue;
        if (promo.minQuantity && item.quantity < promo.minQuantity) continue;
        if (promo.type === 'por_cantidad' && promo.discountPercent) {
          const d = item.price * item.quantity * Number(promo.discountPercent) / 100;
          item.discount = (item.discount || 0) + d;
        }
        if (promo.type === 'bonificacion' && promo.bonusQuantity && promo.minQuantity) {
          const groups = Math.floor(item.quantity / promo.minQuantity);
          const freeQty = groups * (promo.minQuantity - promo.bonusQuantity);
          const d = item.price * freeQty;
          item.discount = (item.discount || 0) + d;
        }
      }
    }

    const subtotal = items.reduce((sum, i) => sum + i.price * i.quantity - (i.discount || 0), 0);

    for (const promo of promos) {
      if (promo.type === 'por_monto' && promo.minTotal && promo.discountPercent) {
        if (subtotal >= Number(promo.minTotal)) {
          const d = subtotal * Number(promo.discountPercent) / 100;
          extraDiscount += d;
        }
      }
    }

    return { items, discount: extraDiscount };
  }
}
