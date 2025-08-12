import { Module } from '@nestjs/common';
import { CashMovementsService } from './cash-movements.service';
import { CashMovementsController } from './cash-movements.controller';
import { PrismaService } from '../prisma.service';
import { AuditService } from '../audit/audit.service';

@Module({
  controllers: [CashMovementsController],
  providers: [CashMovementsService, PrismaService, AuditService],
})
export class CashMovementsModule {}

