import { Module } from '@nestjs/common';
import { PackagingService } from './packaging.service';
import { PackagingController } from './packaging.controller';
import { PrismaService } from '../prisma.service';
import { LabelsService } from '../labels/labels.service';
import { ScaleFakeService } from '../scale-fake/scale-fake.service';
import { AuditService } from '../audit/audit.service';

@Module({
  controllers: [PackagingController],
  providers: [PackagingService, PrismaService, LabelsService, ScaleFakeService, AuditService],
})
export class PackagingModule {}
