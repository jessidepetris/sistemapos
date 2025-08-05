export class CreateAuditLogDto {
  userId: string;
  userEmail: string;
  action: string;
  entity: string;
  entityId?: string;
  description: string;
}
