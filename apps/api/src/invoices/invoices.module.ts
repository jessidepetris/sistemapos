import { Module } from '@nestjs/common';
import { InvoicesService } from './invoices.service';
import { InvoicesController } from './invoices.controller';
import { PrismaService } from '../prisma.service';
import { AuditService } from '../audit/audit.service';
import { DocumentsService } from '../documents/documents.service';
import { AfipModule } from '../afip/afip.module';

@Module({
  imports: [AfipModule],
  controllers: [InvoicesController],
  providers: [InvoicesService, PrismaService, AuditService, DocumentsService],
})
export class InvoicesModule {}
