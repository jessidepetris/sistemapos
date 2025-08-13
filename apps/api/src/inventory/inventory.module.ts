import { Module } from '@nestjs/common';
import { InventoryService } from './inventory.service';
import { InventoryController } from './inventory.controller';
import { PrismaService } from '../prisma.service';
import { AuditService } from '../audit/audit.service';

@Module({
  controllers: [InventoryController],
  providers: [InventoryService, PrismaService, AuditService],
})
export class InventoryModule {}

