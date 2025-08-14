import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma.service';
import { CreateProductDto } from './dto/create-product.dto';
import { UpdateProductDto } from './dto/update-product.dto';
import { PriceMode } from '@prisma/client';

@Injectable()
export class ProductsService {
  constructor(private prisma: PrismaService) {}

  create(data: CreateProductDto) {
    return this.prisma.product.create({ data });
  }

  async findAll(page = 1, pageSize = 100) {
    const products = await this.prisma.product.findMany({
      select: {
        id: true,
        name: true,
        priceARS: true,
        stock: true,
        isComposite: true,
        priceMode: true,
        kitItems: { include: { component: { select: { id: true, priceARS: true, stock: true } } } },
      },
      orderBy: { name: 'asc' },
      skip: (page - 1) * pageSize,
      take: pageSize,
    });
    return products.map(p => this.decorateComposite(p));
  }

  async findOne(id: number) {
    const product = await this.prisma.product.findUnique({
      where: { id },
      include: { kitItems: { include: { component: true } } },
    });
    return product ? this.decorateComposite(product) : null;
  }

  async findByBarcode(code: string) {
    const variant = await this.prisma.packVariant.findFirst({
      where: { OR: [{ barcode: code }, { fakeScaleBarcode: code }] },
      include: { parentProduct: { include: { kitItems: { include: { component: true } } } } },
    });
    if (variant) {
      const product = this.decorateComposite(variant.parentProduct);
      let price: any;
      if (variant.fakeScaleBarcode === code && variant.fakeScaleScheme === 'PRICE_EMBEDDED') {
        price = Number(code.slice(7, 12)) / 100;
      } else if (variant.priceMode === 'FIXED' && variant.fixedPrice) {
        price = variant.fixedPrice;
      } else {
        price = (product.pricePerKg || 0) * Number(variant.contentKg);
      }
      return {
        ...product,
        variantId: variant.id,
        variantName: variant.name,
        priceARS: price,
        stockPacks: variant.stockPacks,
        contentKg: variant.contentKg,
        consumeMode: variant.consumeMode,
        parentStock: variant.parentProduct.stock,
      };
    }
    const product = await this.prisma.product.findFirst({
      where: { OR: [{ barcodes: { has: code } }, { kitBarcode: code }] },
      select: {
        id: true,
        name: true,
        priceARS: true,
        imageUrl: true,
        variants: true,
        subcategory: true,
        isComposite: true,
        kitItems: { include: { component: true } },
      },
    });
    return product ? this.decorateComposite(product) : null;
  }

  async findSimilar(id: number) {
    const product = await this.prisma.product.findUnique({ where: { id } });
    if (!product || !product.subcategory) {
      return [];
    }
    return this.prisma.product.findMany({
      where: {
        subcategory: product.subcategory,
        NOT: { id: product.id },
      },
      take: 5,
      select: {
        id: true,
        name: true,
        priceARS: true,
        imageUrl: true,
      },
    });
  }

  update(id: number, data: UpdateProductDto) {
    return this.prisma.product.update({ where: { id }, data });
  }

  remove(id: number) {
    return this.prisma.product.delete({ where: { id } });
  }

  private decorateComposite(product: any) {
    if (!product.isComposite || !product.kitItems) return product;
    if (product.priceMode === PriceMode.SUM_COMPONENTS) {
      product.priceARS = product.kitItems.reduce(
        (sum: number, ki: any) => sum + Number(ki.quantity) * Number(ki.component.priceARS),
        0,
      );
    }
    const stocks = product.kitItems.map((ki: any) =>
      Math.floor(ki.component.stock / Number(ki.quantity)),
    );
    product.stock = stocks.length ? Math.min(...stocks) : 0;
    return product;
  }
}
