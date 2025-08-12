import { Module } from '@nestjs/common';
import { SalesService } from './sales.service';
import { SalesController } from './sales.controller';
import { PromotionsModule } from '../promotions/promotions.module';
import { PrismaService } from '../prisma.service';
import { AuditService } from '../audit/audit.service';
import { PaymentsModule } from '../payments/payments.module';

@Module({
  imports: [PromotionsModule, PaymentsModule],
  controllers: [SalesController],
  providers: [SalesService, PrismaService, AuditService],
})
export class SalesModule {}
