import { Module } from '@nestjs/common';
import { ReplenishmentService } from './replenishment.service';
import { ReplenishmentController } from './replenishment.controller';
import { PrismaService } from '../prisma.service';

@Module({
  controllers: [ReplenishmentController],
  providers: [ReplenishmentService, PrismaService],
})
export class ReplenishmentModule {}
