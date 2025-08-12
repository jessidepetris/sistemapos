import { AuditActionType } from '@prisma/client';

export class CreateAuditLogDto {
  userId: string;
  userEmail: string;
  actionType: AuditActionType;
  entity: string;
  entityId?: string;
  details?: string;
}
