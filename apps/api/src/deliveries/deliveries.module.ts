import { Module } from '@nestjs/common';
import { DeliveriesService } from './deliveries.service';
import { DeliveriesController } from './deliveries.controller';
import { PrismaService } from '../prisma.service';
import { AuditService } from '../audit/audit.service';

@Module({
  controllers: [DeliveriesController],
  providers: [DeliveriesService, PrismaService, AuditService],
})
export class DeliveriesModule {}
