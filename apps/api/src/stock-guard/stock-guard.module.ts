import { Module } from '@nestjs/common';
import { StockGuardService } from './stock-guard.service';
import { StockGuardController } from './stock-guard.controller';
import { PrismaService } from '../prisma.service';
import { AuditModule } from '../audit/audit.module';

@Module({
  imports: [AuditModule],
  providers: [StockGuardService, PrismaService],
  controllers: [StockGuardController],
  exports: [StockGuardService],
})
export class StockGuardModule {}
