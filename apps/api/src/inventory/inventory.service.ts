import { Injectable, ForbiddenException, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma.service';
import { StartInventoryDto } from './dto/start-inventory.dto';
import { AddInventoryItemDto } from './dto/add-item.dto';
import { UpdateInventoryItemDto } from './dto/update-item.dto';
import { AuditService } from '../audit/audit.service';
import { AuditActionType, PhysicalInventoryStatus } from '@prisma/client';

@Injectable()
export class InventoryService {
  constructor(private prisma: PrismaService, private audit: AuditService) {}

  start(userId: string, dto: StartInventoryDto) {
    return this.prisma.physicalInventory.create({
      data: { userId, notes: dto.notes, status: PhysicalInventoryStatus.DRAFT },
    });
  }

  async addItem(inventoryId: string, dto: AddInventoryItemDto, userId: string) {
    const inventory = await this.prisma.physicalInventory.findUnique({
      where: { id: inventoryId },
    });
    if (!inventory) throw new NotFoundException('Inventory not found');
    const product = await this.prisma.product.findUnique({
      where: { id: dto.productId },
    });
    if (!product) throw new NotFoundException('Product not found');
    const systemQty = product.stock;
    const item = await this.prisma.physicalInventoryItem.create({
      data: {
        physicalInventoryId: inventoryId,
        productId: dto.productId,
        systemQty,
        countedQty: dto.countedQty,
        difference: dto.countedQty - systemQty,
      },
    });
    await this.audit.log({
      userId,
      userEmail: '',
      actionType: AuditActionType.INVENTORY_ADJUSTMENT,
      entity: 'PhysicalInventoryItem',
      entityId: item.id,
      details: `Added product ${dto.productId} counted ${dto.countedQty}`,
    });
    return item;
  }

  async updateItem(inventoryId: string, itemId: string, dto: UpdateInventoryItemDto, userId: string) {
    const item = await this.prisma.physicalInventoryItem.findFirst({
      where: { id: itemId, physicalInventoryId: inventoryId },
    });
    if (!item) throw new NotFoundException('Item not found');
    const updated = await this.prisma.physicalInventoryItem.update({
      where: { id: itemId },
      data: {
        countedQty: dto.countedQty,
        difference: dto.countedQty - item.systemQty,
      },
    });
    await this.audit.log({
      userId,
      userEmail: '',
      actionType: AuditActionType.INVENTORY_ADJUSTMENT,
      entity: 'PhysicalInventoryItem',
      entityId: itemId,
      details: `Updated counted qty to ${dto.countedQty}`,
    });
    return updated;
  }

  async complete(inventoryId: string, userId: string) {
    const inventory = await this.prisma.physicalInventory.findUnique({
      where: { id: inventoryId },
      include: { items: true },
    });
    if (!inventory) throw new NotFoundException('Inventory not found');
    if (inventory.status === PhysicalInventoryStatus.COMPLETED)
      throw new ForbiddenException('Already completed');

    await this.prisma.$transaction(async (tx) => {
      for (const item of inventory.items) {
        if (item.difference !== 0) {
          await tx.stockAdjustment.create({
            data: {
              productId: item.productId,
              qtyChange: item.difference,
              reason: 'Physical count adjustment',
              linkedInventoryId: inventoryId,
              userId,
            },
          });
          await tx.product.update({
            where: { id: item.productId },
            data: { stock: { increment: item.difference } },
          });
        }
      }
      await tx.physicalInventory.update({
        where: { id: inventoryId },
        data: { status: PhysicalInventoryStatus.COMPLETED },
      });
    });

    await this.audit.log({
      userId,
      userEmail: '',
      actionType: AuditActionType.INVENTORY_ADJUSTMENT,
      entity: 'PhysicalInventory',
      entityId: inventoryId,
      details: `Inventario físico completado con ${inventory.items.length} items` ,
    });
    return { completed: true };
  }

  list() {
    return this.prisma.physicalInventory.findMany({ include: { items: true } });
  }

  get(id: string) {
    return this.prisma.physicalInventory.findUnique({
      where: { id },
      include: { items: true },
    });
  }

  cancel(id: string) {
    return this.prisma.physicalInventory.update({
      where: { id },
      data: { status: PhysicalInventoryStatus.CANCELLED },
    });
  }
}

