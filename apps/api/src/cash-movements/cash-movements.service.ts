import { ConflictException, Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma.service';
import { AuditService } from '../audit/audit.service';
import { AuditActionType, CashMovementType, CashRegisterStatus } from '@prisma/client';

@Injectable()
export class CashMovementsService {
  constructor(private prisma: PrismaService, private audit: AuditService) {}

  async create(data: {
    sessionId: string;
    type: CashMovementType;
    paymentMethod: any;
    amount: number;
    concept: string;
    relatedSaleId?: string;
    relatedPurchaseId?: string;
    user?: { id?: string; email?: string };
  }) {
    const session = await this.prisma.cashRegisterSession.findUnique({ where: { id: data.sessionId } });
    if (!session || session.status !== CashRegisterStatus.OPEN) {
      throw new ConflictException('Sesión no abierta');
    }
    const movement = await this.prisma.cashMovement.create({ data: { ...data } });
    await this.audit.log({
      userId: data.user?.id ?? 'unknown',
      userEmail: data.user?.email ?? 'unknown',
      actionType: AuditActionType.CASH_MOVEMENT_ADD,
      entity: 'CashMovement',
      entityId: movement.id,
      details: data.type,
    });
    return movement;
  }

  listBySession(sessionId: string) {
    return this.prisma.cashMovement.findMany({ where: { sessionId } });
  }
}

