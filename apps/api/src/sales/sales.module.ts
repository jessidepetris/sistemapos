import { Module } from '@nestjs/common';
import { SalesService } from './sales.service';
import { SalesController } from './sales.controller';
import { PromotionsModule } from '../promotions/promotions.module';
import { PrismaService } from '../prisma.service';

@Module({
  imports: [PromotionsModule],
  controllers: [SalesController],
  providers: [SalesService, PrismaService],
})
export class SalesModule {}
