import { Module } from '@nestjs/common';
import { CashRegisterController } from './cash-register.controller';
import { CashSessionsService } from '../cash-sessions/cash-sessions.service';
import { CashMovementsService } from '../cash-movements/cash-movements.service';
import { PrismaService } from '../prisma.service';
import { AuditService } from '../audit/audit.service';

@Module({
  controllers: [CashRegisterController],
  providers: [CashSessionsService, CashMovementsService, PrismaService, AuditService],
})
export class CashRegisterModule {}
