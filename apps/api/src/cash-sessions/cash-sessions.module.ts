import { Module } from '@nestjs/common';
import { CashSessionsService } from './cash-sessions.service';
import { CashSessionsController } from './cash-sessions.controller';
import { PrismaService } from '../prisma.service';
import { AuditService } from '../audit/audit.service';

@Module({
  controllers: [CashSessionsController],
  providers: [CashSessionsService, PrismaService, AuditService],
})
export class CashSessionsModule {}

