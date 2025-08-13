import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma.service';
import { PaymentGateway, PaymentStatus } from '@prisma/client';

interface CreatePaymentParams {
  saleId: string;
  amount: number;
  description: string;
  customer?: { email?: string; name?: string };
}

@Injectable()
export class PaymentsService {
  constructor(private prisma: PrismaService) {}

  async createMercadoPago(params: CreatePaymentParams) {
    const res = await fetch('https://api.mercadopago.com/checkout/preferences', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${process.env.MP_ACCESS_TOKEN}`,
      },
      body: JSON.stringify({
        items: [{ title: params.description, quantity: 1, unit_price: params.amount, currency_id: 'ARS' }],
        payer: { email: params.customer?.email, name: params.customer?.name },
        back_urls: {
          success: process.env.MP_SUCCESS_URL,
          failure: process.env.MP_FAILURE_URL,
        },
        notification_url: `${process.env.FRONTEND_BASE_URL || ''}/api/payments/mp/webhook`,
        auto_return: 'approved',
      }),
    });
    const pref = await res.json();
    return this.prisma.payment.create({
      data: {
        saleId: params.saleId,
        gateway: PaymentGateway.MP,
        methodLabel: 'MERCADO PAGO',
        amount: params.amount,
        status: PaymentStatus.PENDING,
        externalOrderId: pref.id,
        qrOrLink: pref.init_point,
      },
    });
  }

  async createGetnet(params: CreatePaymentParams) {
    // Placeholder implementation
    const link = `${process.env.GETNET_BASE_URL || 'https://getnet.test'}/pay/${params.saleId}`;
    return this.prisma.payment.create({
      data: {
        saleId: params.saleId,
        gateway: PaymentGateway.GETNET,
        methodLabel: 'GETNET',
        amount: params.amount,
        status: PaymentStatus.PENDING,
        qrOrLink: link,
      },
    });
  }

  async refreshStatus(id: string) {
    const payment = await this.prisma.payment.findUnique({ where: { id }, include: { sale: true } });
    if (!payment) return null;
    if (payment.gateway === PaymentGateway.MP && payment.externalId) {
      const res = await fetch(`https://api.mercadopago.com/v1/payments/${payment.externalId}`, {
        headers: { Authorization: `Bearer ${process.env.MP_ACCESS_TOKEN}` },
      });
      const data = await res.json();
      await this.prisma.payment.update({
        where: { id },
        data: {
          status: this.mapMpStatus(data.status),
          fee: data.fee_details?.reduce((s: number, f: any) => s + Number(f.amount), 0) || 0,
          netAmount: data.transaction_amount - (data.fee_details?.reduce((s: number, f: any) => s + Number(f.amount), 0) || 0),
        },
      });
    }
    return this.recomputeSaleTotals(payment.saleId!);
  }

  private mapMpStatus(status: string): PaymentStatus {
    switch (status) {
      case 'approved':
        return PaymentStatus.APPROVED;
      case 'authorized':
        return PaymentStatus.AUTHORIZED;
      case 'rejected':
        return PaymentStatus.REJECTED;
      case 'cancelled':
        return PaymentStatus.CANCELED;
      case 'refunded':
        return PaymentStatus.REFUNDED;
      case 'in_process':
      case 'pending':
      default:
        return PaymentStatus.PENDING;
    }
  }

  async recomputeSaleTotals(saleId: string) {
    const payments = await this.prisma.payment.findMany({
      where: { saleId, status: { in: [PaymentStatus.APPROVED] } },
    });
    const paid = payments.reduce((sum, p) => sum + Number(p.amount), 0);
    const sale = await this.prisma.sale.update({
      where: { id: saleId },
      data: { paid, balance: { decrement: 0 } },
    });
    await this.prisma.sale.update({
      where: { id: saleId },
      data: { balance: Number(sale.total) - paid },
    });
    return sale;
  }
}
