import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma.service';
import { CreateKitDto } from './dto/create-kit.dto';
import { UpdateKitDto } from './dto/update-kit.dto';
import { PriceMode } from '@prisma/client';

@Injectable()
export class KitsService {
  constructor(private prisma: PrismaService) {}

  async create(dto: CreateKitDto) {
    const product = await this.prisma.product.create({
      data: {
        name: dto.name,
        description: dto.description,
        stock: 0,
        minStock: 0,
        costARS: 0,
        costUSD: null,
        priceARS: dto.priceMode === PriceMode.FIXED ? dto.priceARS || 0 : 0,
        unit: dto.unit,
        category: dto.category,
        subcategory: dto.subcategory,
        barcodes: dto.kitBarcode ? [dto.kitBarcode] : [],
        variants: null,
        isBulk: false,
        isRefrigerated: false,
        requiresLabel: false,
        imageUrl: dto.imageUrl,
        isComposite: true,
        kitBarcode: dto.kitBarcode,
        priceMode: dto.priceMode,
        kitItems: {
          create: dto.components.map(c => ({
            componentId: c.componentId,
            quantity: c.quantity,
          })),
        },
      },
      include: { kitItems: { include: { component: true } } },
    });
    return product;
  }

  async findAll() {
    const kits = await this.prisma.product.findMany({
      where: { isComposite: true },
      include: { kitItems: { include: { component: true } } },
    });
    return kits.map(k => this.decorate(k));
  }

  async findOne(id: number) {
    const kit = await this.prisma.product.findFirst({
      where: { id, isComposite: true },
      include: { kitItems: { include: { component: true } } },
    });
    return kit ? this.decorate(kit) : null;
  }

  async update(id: number, dto: UpdateKitDto) {
    const kit = await this.prisma.product.update({
      where: { id },
      data: {
        name: dto.name,
        description: dto.description,
        kitBarcode: dto.kitBarcode,
        priceMode: dto.priceMode,
        priceARS:
          dto.priceMode === PriceMode.FIXED ? dto.priceARS || 0 : 0,
        unit: dto.unit,
        category: dto.category,
        subcategory: dto.subcategory,
        imageUrl: dto.imageUrl,
        kitItems: dto.components
          ? {
              deleteMany: {},
              create: dto.components.map(c => ({
                componentId: c.componentId,
                quantity: c.quantity,
              })),
            }
          : undefined,
        barcodes: dto.kitBarcode ? [dto.kitBarcode] : [],
      },
      include: { kitItems: { include: { component: true } } },
    });
    return this.decorate(kit);
  }

  private decorate(kit: any) {
    if (kit.priceMode === PriceMode.SUM_COMPONENTS) {
      kit.priceARS = kit.kitItems.reduce(
        (sum: number, ki: any) => sum + Number(ki.quantity) * Number(ki.component.priceARS),
        0,
      );
    }
    const stocks = kit.kitItems.map((ki: any) =>
      Math.floor(Number(ki.component.stock) / Number(ki.quantity)),
    );
    kit.stock = stocks.length ? Math.min(...stocks) : 0;
    return kit;
  }
}
