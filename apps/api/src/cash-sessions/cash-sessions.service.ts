import { ConflictException, Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma.service';
import { AuditService } from '../audit/audit.service';
import {
  AuditActionType,
  CashRegisterStatus,
  PaymentMethod,
  CashMovementType,
  CashClosureType,
  PaymentStatus,
} from '@prisma/client';
import PDFDocument from 'pdfkit';

@Injectable()
export class CashSessionsService {
  constructor(private prisma: PrismaService, private audit: AuditService) {}

  async open(cashRegisterId: string, openingAmount: number, user: { id?: string; email?: string }) {
    const existing = await this.prisma.cashRegisterSession.findFirst({
      where: { cashRegisterId, status: CashRegisterStatus.OPEN },
    });
    if (existing) throw new ConflictException('Caja ya abierta');
    const session = await this.prisma.cashRegisterSession.create({
      data: {
        cashRegisterId,
        openingAmount,
        openedAt: new Date(),
        openedById: user.id ?? 'unknown',
      },
    });
    await this.audit.log({
      userId: user.id ?? 'unknown',
      userEmail: user.email ?? 'unknown',
      actionType: AuditActionType.CASH_REGISTER_OPEN,
      entity: 'CashRegisterSession',
      entityId: session.id,
    });
    return session;
  }

  async close(
    id: string,
    closingAmount: number,
    user: { id?: string; email?: string },
    counts?: { denomination: number; quantity: number }[],
    countedBy?: string,
    notes?: string,
  ) {
    const session = await this.prisma.cashRegisterSession.findUnique({ where: { id } });
    if (!session) throw new NotFoundException();
    if (session.status === CashRegisterStatus.CLOSED) throw new ConflictException('Ya cerrada');
    const payments = await this.prisma.payment.findMany({
      where: {
        createdAt: { gte: session.openedAt, lte: new Date() },
        status: PaymentStatus.APPROVED,
      },
    });
    const salesByMethod: Record<PaymentMethod, number> = {
      CASH: 0,
      CARD: 0,
      TRANSFER: 0,
      MP: 0,
      GETNET: 0,
      OTHER: 0,
    } as any;
    for (const p of payments) {
      const method = this.normalizeMethod(p.methodLabel);
      salesByMethod[method] = (salesByMethod[method] || 0) + Number(p.amount);
    }
    const systemSalesTotal = payments.reduce((sum, p) => sum + Number(p.amount), 0);

    const expenses = await this.prisma.cashMovement.findMany({
      where: { sessionId: id, type: CashMovementType.EXPENSE },
    });
    const expensesByMethod: Record<PaymentMethod, number> = {
      CASH: 0,
      CARD: 0,
      TRANSFER: 0,
      MP: 0,
      GETNET: 0,
      OTHER: 0,
    } as any;
    for (const e of expenses) {
      expensesByMethod[e.paymentMethod] = (expensesByMethod[e.paymentMethod] || 0) + Number(e.amount);
    }
    const systemExpensesTotal = expenses.reduce((sum, e) => sum + Number(e.amount), 0);
    const incomes = await this.prisma.cashMovement.findMany({
      where: { sessionId: id, type: CashMovementType.INCOME },
    });
    const incomesByMethod: Record<PaymentMethod, number> = {
      CASH: 0,
      CARD: 0,
      TRANSFER: 0,
      MP: 0,
      GETNET: 0,
      OTHER: 0,
    } as any;
    for (const i of incomes) {
      incomesByMethod[i.paymentMethod] = (incomesByMethod[i.paymentMethod] || 0) + Number(i.amount);
    }
    const systemIncomeTotal = incomes.reduce((sum, i) => sum + Number(i.amount), 0);
    let countedCash = closingAmount;
    let countedBreakdown: any = null;
    if (counts && counts.length > 0) {
      countedCash = counts.reduce(
        (sum, c) => sum + Number(c.denomination) * Number(c.quantity),
        0,
      );
      countedBreakdown = counts;
    }
    const theoretical =
      Number(session.openingAmount) +
      (salesByMethod.CASH || 0) +
      (incomesByMethod.CASH || 0) -
      (expensesByMethod.CASH || 0);
    const difference = countedCash - theoretical;

    const byMethodJson = {
      sales: salesByMethod,
      income: incomesByMethod,
      expenses: expensesByMethod,
    };

    const closed = await this.prisma.cashRegisterSession.update({
      where: { id },
      data: {
        closingAmount: countedCash,
        closedAt: new Date(),
        systemSalesTotal,
        systemExpensesTotal,
        byMethodJson,
        difference,
        status: CashRegisterStatus.CLOSED,
        closedById: user.id ?? 'unknown',
        countedBy,
        notes,
      },
    });
    await this.prisma.cashClosure.create({
      data: {
        sessionId: id,
        type: CashClosureType.Z,
        createdById: user.id ?? 'unknown',
        totalsByMethod: byMethodJson,
        totalSales: systemSalesTotal,
        totalIncome: systemIncomeTotal,
        totalExpense: systemExpensesTotal,
        totalCashCalc: theoretical,
        countedBreakdown,
        countedCash,
        difference,
        notes,
      },
    });
    await this.audit.log({
      userId: user.id ?? 'unknown',
      userEmail: user.email ?? 'unknown',
      actionType: AuditActionType.CASH_CLOSURE_Z,
      entity: 'CashSession',
      entityId: id,
    });
    return closed;
  }

  async closureX(id: string, user: { id?: string; email?: string }, notes?: string) {
    const session = await this.prisma.cashRegisterSession.findUnique({ where: { id } });
    if (!session) throw new NotFoundException();
    const payments = await this.prisma.payment.findMany({
      where: { createdAt: { gte: session.openedAt, lte: new Date() }, status: PaymentStatus.APPROVED },
    });
    const salesByMethod: Record<PaymentMethod, number> = {
      CASH: 0,
      CARD: 0,
      TRANSFER: 0,
      MP: 0,
      GETNET: 0,
      OTHER: 0,
    } as any;
    for (const p of payments) {
      const method = this.normalizeMethod(p.methodLabel);
      salesByMethod[method] = (salesByMethod[method] || 0) + Number(p.amount);
    }
    const systemSalesTotal = payments.reduce((sum, p) => sum + Number(p.amount), 0);
    const expenses = await this.prisma.cashMovement.findMany({
      where: { sessionId: id, type: CashMovementType.EXPENSE },
    });
    const expensesByMethod: Record<PaymentMethod, number> = {
      CASH: 0,
      CARD: 0,
      TRANSFER: 0,
      MP: 0,
      GETNET: 0,
      OTHER: 0,
    } as any;
    for (const e of expenses) {
      expensesByMethod[e.paymentMethod] = (expensesByMethod[e.paymentMethod] || 0) + Number(e.amount);
    }
    const systemExpensesTotal = expenses.reduce((sum, e) => sum + Number(e.amount), 0);
    const incomes = await this.prisma.cashMovement.findMany({
      where: { sessionId: id, type: CashMovementType.INCOME },
    });
    const incomesByMethod: Record<PaymentMethod, number> = {
      CASH: 0,
      CARD: 0,
      TRANSFER: 0,
      MP: 0,
      GETNET: 0,
      OTHER: 0,
    } as any;
    for (const i of incomes) {
      incomesByMethod[i.paymentMethod] = (incomesByMethod[i.paymentMethod] || 0) + Number(i.amount);
    }
    const systemIncomeTotal = incomes.reduce((sum, i) => sum + Number(i.amount), 0);
    const theoretical =
      Number(session.openingAmount) +
      (salesByMethod.CASH || 0) +
      (incomesByMethod.CASH || 0) -
      (expensesByMethod.CASH || 0);
    const closure = await this.prisma.cashClosure.create({
      data: {
        sessionId: id,
        type: CashClosureType.X,
        createdById: user.id ?? 'unknown',
        totalSales: systemSalesTotal,
        totalIncome: systemIncomeTotal,
        totalExpense: systemExpensesTotal,
        totalCashCalc: theoretical,
        totalsByMethod: { sales: salesByMethod, income: incomesByMethod, expenses: expensesByMethod },
        notes,
      },
    });
    await this.audit.log({
      userId: user.id ?? 'unknown',
      userEmail: user.email ?? 'unknown',
      actionType: AuditActionType.CASH_CLOSURE_X,
      entity: 'CashSession',
      entityId: id,
    });
    return closure;
  }

  listClosures(params: { from?: Date; to?: Date }) {
    const { from, to } = params;
    return this.prisma.cashClosure.findMany({
      where: {
        createdAt: {
          gte: from,
          lte: to,
        },
      },
      orderBy: { createdAt: 'desc' },
    });
  }

  findOne(id: string) {
    return this.prisma.cashRegisterSession.findUnique({
      where: { id },
      include: { movements: true, cashRegister: true },
    });
  }

  findAll(params: any, user?: { id?: string }) {
    const { from, to, status, cashRegisterId, openedBy } = params;
    return this.prisma.cashRegisterSession.findMany({
      where: {
        cashRegisterId,
        status,
        openedById: openedBy,
        openedAt: { gte: from, lte: to },
      },
      include: { cashRegister: true },
    });
  }

  async currentForUser(userId: string) {
    if (!userId) return { sessionId: null };
    const session = await this.prisma.cashRegisterSession.findFirst({
      where: { openedById: userId, status: CashRegisterStatus.OPEN },
      include: { cashRegister: true },
    });
    if (!session) return { sessionId: null };
    const payments = await this.prisma.payment.findMany({
      where: {
        createdAt: { gte: session.openedAt, lte: new Date() },
        status: PaymentStatus.APPROVED,
      },
    });
    const salesByMethod: Record<PaymentMethod, number> = {
      CASH: 0,
      CARD: 0,
      TRANSFER: 0,
      MP: 0,
      GETNET: 0,
      OTHER: 0,
    } as any;
    for (const p of payments) {
      const method = this.normalizeMethod(p.methodLabel);
      salesByMethod[method] = (salesByMethod[method] || 0) + Number(p.amount);
    }
    const expenses = await this.prisma.cashMovement.findMany({
      where: { sessionId: session.id, type: CashMovementType.EXPENSE },
    });
    const expensesByMethod: Record<PaymentMethod, number> = {
      CASH: 0,
      CARD: 0,
      TRANSFER: 0,
      MP: 0,
      GETNET: 0,
      OTHER: 0,
    } as any;
    for (const e of expenses) {
      expensesByMethod[e.paymentMethod] =
        (expensesByMethod[e.paymentMethod] || 0) + Number(e.amount);
    }
    const theoreticalCash =
      Number(session.openingAmount) +
      (salesByMethod.CASH || 0) -
      (expensesByMethod.CASH || 0);

    return {
      sessionId: session.id,
      cashRegister: {
        id: session.cashRegisterId,
        name: session.cashRegister.name,
      },
      openingDate: session.openedAt,
      openingAmount: session.openingAmount,
      byMethod: salesByMethod,
      cashOutflows: expensesByMethod,
      theoreticalCash,
    };
  }

  async lastClosedForUser(userId: string) {
    if (!userId) return { sessionId: null };
    const session = await this.prisma.cashRegisterSession.findFirst({
      where: { openedById: userId, status: CashRegisterStatus.CLOSED },
      orderBy: { closedAt: 'desc' },
      include: { cashRegister: true },
    });
    if (!session) return { sessionId: null };
    const bm: any = session.byMethodJson || { sales: {}, expenses: {} };
    const theoreticalCashAtClose =
      Number(session.openingAmount) +
      (bm.sales?.CASH || 0) -
      (bm.expenses?.CASH || 0);
    return {
      sessionId: session.id,
      cashRegister: {
        id: session.cashRegisterId,
        name: session.cashRegister.name,
      },
      closingDate: session.closedAt,
      difference: session.difference,
      closingAmount: session.closingAmount,
      theoreticalCashAtClose,
    };
  }

  async previewClose(sessionId: string, closingAmount: number) {
    const session = await this.prisma.cashRegisterSession.findUnique({
      where: { id: sessionId },
    });
    if (!session) throw new NotFoundException();
    const payments = await this.prisma.payment.findMany({
      where: {
        createdAt: { gte: session.openedAt, lte: new Date() },
        status: PaymentStatus.APPROVED,
      },
    });
    const salesByMethod: Record<PaymentMethod, number> = {
      CASH: 0,
      CARD: 0,
      TRANSFER: 0,
      MP: 0,
      GETNET: 0,
      OTHER: 0,
    } as any;
    for (const p of payments) {
      const method = this.normalizeMethod(p.methodLabel);
      salesByMethod[method] = (salesByMethod[method] || 0) + Number(p.amount);
    }
    const expenses = await this.prisma.cashMovement.findMany({
      where: { sessionId: sessionId, type: CashMovementType.EXPENSE },
    });
    const expensesByMethod: Record<PaymentMethod, number> = {
      CASH: 0,
      CARD: 0,
      TRANSFER: 0,
      MP: 0,
      GETNET: 0,
      OTHER: 0,
    } as any;
    for (const e of expenses) {
      expensesByMethod[e.paymentMethod] =
        (expensesByMethod[e.paymentMethod] || 0) + Number(e.amount);
    }
    const theoreticalCash =
      Number(session.openingAmount) +
      (salesByMethod.CASH || 0) -
      (expensesByMethod.CASH || 0);
    const difference = closingAmount - theoreticalCash;
    return { theoreticalCash, difference };
  }

  async addSaleMovement(saleId: string, amount: number, user: { id?: string }) {
    if (!user?.id) return;
    const session = await this.prisma.cashRegisterSession.findFirst({
      where: { openedById: user.id, status: CashRegisterStatus.OPEN },
    });
    if (!session) throw new ConflictException('Caja no abierta');
    return this.prisma.cashMovement.create({
      data: {
        sessionId: session.id,
        type: CashMovementType.SALE,
        paymentMethod: PaymentMethod.CASH,
        amount,
        concept: `Venta ${saleId}`,
        relatedSaleId: saleId,
      },
    });
  }

  async generatePdf(id: string): Promise<Buffer> {
    const session = await this.findOne(id);
    const doc = new PDFDocument();
    const chunks: Buffer[] = [];
    doc.on('data', chunk => chunks.push(chunk as Buffer));
    return new Promise(resolve => {
      doc.on('end', () => resolve(Buffer.concat(chunks)));
      doc.fontSize(16).text(`Caja ${session.cashRegister.name}`);
      doc.text(`Estado: ${session.status}`);
      doc.text(`Apertura: $${session.openingAmount}`);
      doc.text(`Cierre: $${session.closingAmount ?? ''}`);
      doc.text(`Ventas: $${session.systemSalesTotal ?? 0}`);
      doc.text(`Egresos: $${session.systemExpensesTotal ?? 0}`);
      doc.text(`Diferencia: $${session.difference ?? 0}`);
      if (session.byMethodJson) {
        const bm: any = session.byMethodJson;
        doc.moveDown().text('Por método:');
        Object.keys(bm.sales || {}).forEach(k => {
          const sales = bm.sales[k] || 0;
          const exp = bm.expenses?.[k] || 0;
          doc.text(`${k}: ventas $${sales} - egresos $${exp}`);
        });
      }
      doc.moveDown();
      session.movements.forEach(m => {
        doc.text(`${m.type} $${m.amount} - ${m.concept}`);
      });
      doc.end();
    });
  }

  private normalizeMethod(label?: string): PaymentMethod {
    switch (label) {
      case 'CASH':
        return PaymentMethod.CASH;
      case 'CARD':
        return PaymentMethod.CARD;
      case 'TRANSFER':
        return PaymentMethod.TRANSFER;
      case 'MP':
        return PaymentMethod.MP;
      case 'GETNET':
        return PaymentMethod.GETNET;
      default:
        return PaymentMethod.OTHER;
    }
  }
}

