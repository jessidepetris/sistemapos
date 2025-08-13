import { Module } from '@nestjs/common';
import { AfipController } from './afip.controller';
import { AfipQueueService } from './afip.queue.service';
import { AfipWsfeService } from './afip.wsfe.service';
import { PrismaService } from '../prisma.service';
import { AfipPdfService } from './afip.pdf.service';

@Module({
  controllers: [AfipController],
  providers: [AfipQueueService, AfipWsfeService, PrismaService, AfipPdfService],
  exports: [AfipQueueService],
})
export class AfipModule {}
