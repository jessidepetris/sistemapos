import { Module } from '@nestjs/common';
import { ImportsController } from './imports.controller';
import { ImportsService } from './imports.service';
import { PrismaService } from '../prisma.service';
import { AuditService } from '../audit/audit.service';

@Module({
  controllers: [ImportsController],
  providers: [ImportsService, PrismaService, AuditService],
})
export class ImportsModule {}
