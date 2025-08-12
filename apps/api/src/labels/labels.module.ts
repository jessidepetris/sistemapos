import { Module } from '@nestjs/common';
import { LabelsController } from './labels.controller';
import { LabelsService } from './labels.service';
import { PrismaService } from '../prisma.service';
import { AuditService } from '../audit/audit.service';
import { ScaleFakeService } from '../scale-fake/scale-fake.service';

@Module({
  controllers: [LabelsController],
  providers: [LabelsService, PrismaService, AuditService, ScaleFakeService],
})
export class LabelsModule {}
