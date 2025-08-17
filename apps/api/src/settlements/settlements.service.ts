import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma.service';
import {
  PaymentGateway,
  PaymentStatus,
  SettlementGateway,
  SettlementStatus,
} from '@prisma/client';
import { MpSettlementService } from './mp-settlement.service';
import { GetnetSettlementService } from './getnet-settlement.service';
import { parseISO } from 'date-fns';
import { Cron, CronExpression } from '@nestjs/schedule';
import Papa from 'papaparse';
import { MatchStatus, SettlementRecord } from '@prisma/client';

@Injectable()
export class SettlementsService {
  constructor(
    private prisma: PrismaService,
    private mp: MpSettlementService,
    private getnet: GetnetSettlementService,
  ) {}

  async importCsv(
    gateway: SettlementGateway,
    csv: Buffer,
    periodStart?: string,
    periodEnd?: string,
  ) {
    const text = csv.toString('utf8');
    const parsed = Papa.parse(text, { header: true });
    const start = periodStart ? parseISO(periodStart) : new Date();
    const end = periodEnd ? parseISO(periodEnd) : new Date();
    const recordsData = (parsed.data as any[])
      .filter((r) => r.externalId || r.id)
      .map((r) => ({
        externalId: r.externalId || r.id,
        grossAmount: Number(r.grossAmount || r.amount || 0),
        feeAmount: Number(r.feeAmount || r.fee || 0),
        netAmount: Number(r.netAmount || r.net || 0),
        settledAt: r.settledAt ? new Date(r.settledAt) : undefined,
        currency: r.currency || 'ARS',
      }));
    const settlement = await this.prisma.paymentSettlement.create({
      data: {
        gateway,
        periodStart: start,
        periodEnd: end,
        source: 'CSV',
        records: {
          create: recordsData.map((r) => ({
            externalId: r.externalId,
            grossAmount: r.grossAmount,
            feeAmount: r.feeAmount,
            netAmount: r.netAmount,
            settledAt: r.settledAt,
            currency: r.currency,
          })),
        },
      },
    });
    return settlement;
  }

  async match(id: string) {
    const settlement = await this.prisma.paymentSettlement.findUnique({
      where: { id },
      include: { records: true },
    });
    if (!settlement) return null;
    for (const record of settlement.records) {
      if (record.paymentId) continue;
      if (record.externalId) {
        const payment = await this.prisma.payment.findFirst({
          where: { externalId: record.externalId, gateway: settlement.gateway },
        });
        if (payment) {
          await this.prisma.settlementRecord.update({
            where: { id: record.id },
            data: {
              paymentId: payment.id,
              saleId: payment.saleId || undefined,
              matchStatus: MatchStatus.MATCHED,
            },
          });
          await this.prisma.payment.update({
            where: { id: payment.id },
            data: {
              fee: payment.fee ?? record.feeAmount,
              netAmount: payment.netAmount ?? record.netAmount,
              settledAt: payment.settledAt ?? record.settledAt,
            },
          });
        }
      }
    }
    return this.get(id);
  }
  async run(gateway: SettlementGateway, from: string, to: string) {
    const fromDate = parseISO(from);
    const toDate = parseISO(to);
    const payments =
      gateway === SettlementGateway.MP
        ? await this.mp.fetchPayments(fromDate, toDate)
        : await this.getnet.fetchPayments(fromDate, toDate);
    const settlement = await this.prisma.paymentSettlement.create({
      data: {
        gateway,
        periodStart: fromDate,
        periodEnd: toDate,
        status: SettlementStatus.CONFIRMED,
        records: {
          create: payments.map((p) => ({
            paymentId: p.id,
            saleId: p.saleId,
            externalId: p.externalId,
            grossAmount: p.amount,
            feeAmount: p.fee ?? 0,
            netAmount: Number(
              p.netAmount ?? (Number(p.amount) - Number(p.fee ?? 0)),
            ),
            chargeback: p.chargeback,
            refundAmount: p.refundedAmount,
            settledAt: p.settledAt,
            currency: p.currency,
            matchStatus: 'MATCHED',
          })),
        },
      },
      include: { records: true },
    });
    return settlement;
  }

  @Cron(CronExpression.EVERY_DAY_AT_2AM)
  async cron() {
    const to = new Date();
    const from = new Date(to.getTime() - 7 * 86400000);
    await this.run(SettlementGateway.MP, from.toISOString(), to.toISOString());
    await this.run(SettlementGateway.GETNET, from.toISOString(), to.toISOString());
  }

  async list(
    gateway?: SettlementGateway,
    status?: SettlementStatus,
    page = 1,
    pageSize = 100,
  ) {
    return this.prisma.paymentSettlement.findMany({
      where: {
        ...(gateway ? { gateway } : {}),
        ...(status ? { status } : {}),
      },
      orderBy: { periodStart: 'desc' },
      select: {
        id: true,
        gateway: true,
        periodStart: true,
        periodEnd: true,
        status: true,
        _count: { select: { records: true } },
      },
      skip: (page - 1) * pageSize,
      take: pageSize,
    });
  }

  async get(id: string) {
    return this.prisma.paymentSettlement.findUnique({
      where: { id },
      include: { records: true },
    });
  }

  async retry(id: string) {
    // placeholder for matching logic
    return this.get(id);
  }

  async summary(from: string, to: string, gateway?: SettlementGateway) {
    const where: any = {
      periodStart: { gte: parseISO(from) },
      periodEnd: { lte: parseISO(to) },
    };
    if (gateway) where.gateway = gateway;
    const periods = await this.prisma.paymentSettlement.findMany({
      where,
      include: { records: true },
    });
    let gross = 0,
      fees = 0,
      refunds = 0,
      chargebacks = 0,
      net = 0,
      count = 0;
    periods.forEach((p) => {
      p.records.forEach((r) => {
        gross += Number(r.grossAmount);
        fees += Number(r.feeAmount);
        net += Number(r.netAmount);
        refunds += Number(r.refundAmount || 0);
        if (r.chargeback) chargebacks++;
        count++;
      });
    });
    return {
      gross,
      fees,
      refunds,
      chargebacks,
      net,
      count,
      feePct: gross ? fees / gross : 0,
    };
  }
}
