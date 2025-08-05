import { Module } from '@nestjs/common';
import { LabelsController } from './labels.controller';
import { LabelsService } from './labels.service';
import { PrismaService } from '../prisma.service';

@Module({
  controllers: [LabelsController],
  providers: [LabelsService, PrismaService],
})
export class LabelsModule {}
