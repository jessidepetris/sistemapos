import { Module } from '@nestjs/common';
import { ProductsService } from './products.service';
import { ProductsController } from './products.controller';
import { PrismaService } from '../prisma.service';
import { AuditService } from '../audit/audit.service';

@Module({
  controllers: [ProductsController],
  providers: [ProductsService, PrismaService, AuditService],
})
export class ProductsModule {}
