import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma.service';

@Injectable()
export class AfipWsfeService {
  constructor(private prisma: PrismaService) {}

  async emit(invoiceId: string) {
    // Placeholder implementation: mark invoice with dummy CAE
    const cae = '00000000000000';
    await this.prisma.afipLog.create({
      data: { invoiceId, level: 'INFO', step: 'WSFE_REQUEST', message: 'Simulated request' },
    });
    await this.prisma.invoice.update({
      where: { id: invoiceId },
      data: { cae, caeExpiry: new Date(Date.now() + 1000 * 60 * 60 * 24 * 30), cbteNro: 1 },
    });
    await this.prisma.afipLog.create({
      data: { invoiceId, level: 'INFO', step: 'WSFE_RESPONSE', message: 'Simulated response', response: { cae } },
    });
  }
}
