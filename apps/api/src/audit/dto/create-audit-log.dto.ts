import { AuditActionType } from '@prisma/client';

export enum AuditAction {
  LOGIN = 'LOGIN',
  LOGOUT = 'LOGOUT',
  CREATE = 'CREATE',
  UPDATE = 'UPDATE',
  DELETE = 'DELETE',
  APPROVE = 'APPROVE',
  REJECT = 'REJECT',
  EXPORT = 'EXPORT',
  CASH_OPEN = 'CASH_OPEN',
  CASH_CLOSE = 'CASH_CLOSE',
  INVENTORY_START = 'INVENTORY_START',
  INVENTORY_FINISH = 'INVENTORY_FINISH',
  INVENTORY_APPROVE = 'INVENTORY_APPROVE',
  PAYMENT_CREATE = 'PAYMENT_CREATE',
  PAYMENT_APPROVE = 'PAYMENT_APPROVE',
  PAYMENT_REFUND = 'PAYMENT_REFUND',
  AFIP_ENQUEUE = 'AFIP_ENQUEUE',
  AFIP_EMIT_SUCCESS = 'AFIP_EMIT_SUCCESS',
  AFIP_EMIT_ERROR = 'AFIP_EMIT_ERROR',
}

export class CreateAuditLogDto {
  userId?: string;
  userEmail?: string;
  actionType?: AuditActionType;
  action?: AuditAction;
  entity?: string;
  entityId?: string;
  route?: string;
  method?: string;
  statusCode?: number;
  ip?: string;
  userAgent?: string;
  details?: string;
  before?: any;
  after?: any;
  diff?: any;
  meta?: any;
  ts?: Date;
}
