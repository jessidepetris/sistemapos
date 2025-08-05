import { Module } from '@nestjs/common';
import { PurchasesService } from './purchases.service';
import { PurchasesController } from './purchases.controller';
import { PrismaService } from '../prisma.service';
import { LabelsService } from '../labels/labels.service';

@Module({
  controllers: [PurchasesController],
  providers: [PurchasesService, PrismaService, LabelsService],
})
export class PurchasesModule {}
