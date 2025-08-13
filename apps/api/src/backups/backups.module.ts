import { Module } from '@nestjs/common';
import { BackupsService } from './backups.service';
import { BackupsController } from './backups.controller';
import { PrismaService } from '../prisma.service';
import { AuditService } from '../audit/audit.service';

@Module({
  controllers: [BackupsController],
  providers: [BackupsService, PrismaService, AuditService],
})
export class BackupsModule {}

