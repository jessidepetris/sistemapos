import { Injectable, Logger } from '@nestjs/common';
import { PrismaService } from '../prisma.service';
import { AfipWsfeService } from './afip.wsfe.service';
import { AfipEmissionStatus, AfipErrorType } from '@prisma/client';

@Injectable()
export class AfipQueueService {
  private readonly logger = new Logger('AfipQueue');
  private running = false;

  constructor(private prisma: PrismaService, private wsfe: AfipWsfeService) {}

  async enqueue(saleId: string) {
    const invoice = await this.prisma.invoice.upsert({
      where: { saleId },
      create: {
        saleId,
        docType: 'FC',
        ptoVta: Number(process.env.AFIP_PTO_VTA) || 1,
        status: AfipEmissionStatus.QUEUED,
      },
      update: { status: AfipEmissionStatus.QUEUED },
    });
    await this.prisma.afipQueueItem.create({
      data: { invoiceId: invoice.id },
    });
    this.run();
    return { invoiceId: invoice.id };
  }

  private async run() {
    if (this.running) return;
    this.running = true;
    while (true) {
      const item = await this.prisma.afipQueueItem.findFirst({
        where: { status: 'READY' },
        orderBy: { scheduledAt: 'asc' },
      });
      if (!item) break;
      await this.prisma.afipQueueItem.update({ where: { id: item.id }, data: { status: 'RUNNING', startedAt: new Date() } });
      try {
        await this.wsfe.emit(item.invoiceId);
        await this.prisma.afipQueueItem.update({ where: { id: item.id }, data: { status: 'DONE', finishedAt: new Date() } });
        await this.prisma.invoice.update({ where: { id: item.invoiceId }, data: { status: AfipEmissionStatus.SUCCESS } });
      } catch (e: any) {
        const inv = await this.prisma.invoice.update({
          where: { id: item.invoiceId },
          data: {
            status: AfipEmissionStatus.ERROR,
            errorType: AfipErrorType.UNKNOWN,
            lastError: e.message,
            attempts: { increment: 1 },
          },
        });
        await this.prisma.afipQueueItem.update({ where: { id: item.id }, data: { status: 'FAILED', error: e.message, finishedAt: new Date() } });
        this.logger.error(`AFIP emit failed ${inv.id}: ${e.message}`);
      }
    }
    this.running = false;
  }

  async getStatus(invoiceId: string) {
    return this.prisma.invoice.findUnique({ where: { id: invoiceId } });
  }
}
