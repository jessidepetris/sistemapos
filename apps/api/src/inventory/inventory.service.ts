import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma.service';
import { StartSessionDto } from './dto/start-session.dto';
import { ScanDto } from './dto/scan.dto';
import { InventoryStatus } from '@prisma/client';

@Injectable()
export class InventoryService {
  constructor(private prisma: PrismaService) {}

  async startSession(userId: string, dto: StartSessionDto) {
    const products = await this.prisma.product.findMany({
      select: { id: true, stock: true },
    });
    const itemsData = products.map((p) => ({
      productId: p.id,
      expectedQtyKg: p.stock,
    }));
    return this.prisma.inventorySession.create({
      data: {
        name: dto.name,
        scope: dto.scope,
        storeId: dto.storeId,
        categoryId: dto.categoryId,
        supplierId: dto.supplierId,
        location: dto.location,
        notes: dto.notes,
        status: InventoryStatus.IN_PROGRESS,
        startedById: userId,
        startedAt: new Date(),
        items: {
          createMany: { data: itemsData },
        },
      },
      include: { items: true },
    });
  }

  async addScan(sessionId: string, dto: ScanDto) {
    const session = await this.prisma.inventorySession.findUnique({
      where: { id: sessionId },
    });
    if (!session) throw new NotFoundException('Session not found');

    const product = await this.prisma.product.findFirst({
      where: { barcodes: { has: dto.barcode } },
    });
    if (!product) throw new NotFoundException('Product not found');

    let item = await this.prisma.inventoryItem.findFirst({
      where: { sessionId, productId: product.id },
    });
    if (!item) {
      item = await this.prisma.inventoryItem.create({
        data: {
          sessionId,
          productId: product.id,
          expectedQtyKg: product.stock,
        },
      });
    }

    const currentCount = parseFloat(item.countedQtyKg.toString());
    const expected = parseFloat(item.expectedQtyKg.toString());
    const qty = dto.qty ?? 0;
    const newCount = currentCount + qty;
    const difference = newCount - expected;

    return this.prisma.inventoryItem.update({
      where: { id: item.id },
      data: {
        countedQtyKg: newCount,
        differenceKg: difference,
        barcode: dto.barcode,
        lastScanAt: new Date(),
      },
    });
  }

  listSessions(page = 1, pageSize = 100) {
    return this.prisma.inventorySession.findMany({
      select: {
        id: true,
        name: true,
        status: true,
        startedAt: true,
        closedAt: true,
        _count: { select: { items: true } },
      },
      orderBy: { startedAt: 'desc' },
      skip: (page - 1) * pageSize,
      take: pageSize,
    });
  }

  getSession(id: string) {
    return this.prisma.inventorySession.findUnique({
      where: { id },
      include: { items: true },
    });
  }
}
