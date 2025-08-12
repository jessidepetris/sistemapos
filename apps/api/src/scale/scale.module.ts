import { Module } from '@nestjs/common';
import { ScaleService } from './scale.service';
import { ScaleController } from './scale.controller';
import { PrismaService } from '../prisma.service';

@Module({
  controllers: [ScaleController],
  providers: [ScaleService, PrismaService],
})
export class ScaleModule {}
