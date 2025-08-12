import { Module } from '@nestjs/common';
import { BarcodesService } from './barcodes.service';
import { BarcodesController } from './barcodes.controller';
import { PrismaService } from '../prisma.service';
import { LabelsModule } from '../labels/labels.module';
import { ScaleFakeModule } from '../scale-fake/scale-fake.module';

@Module({
  imports: [LabelsModule, ScaleFakeModule],
  controllers: [BarcodesController],
  providers: [BarcodesService, PrismaService],
})
export class BarcodesModule {}
