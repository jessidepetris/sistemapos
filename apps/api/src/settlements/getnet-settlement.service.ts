import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma.service';
import { PaymentGateway, PaymentStatus } from '@prisma/client';

@Injectable()
export class GetnetSettlementService {
  constructor(private prisma: PrismaService) {}

  async fetchPayments(from: Date, to: Date) {
    return this.prisma.payment.findMany({
      where: {
        gateway: PaymentGateway.GETNET,
        status: PaymentStatus.APPROVED,
        createdAt: { gte: from, lte: to },
      },
    });
  }
}
