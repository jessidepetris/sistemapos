import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma.service';
import { CreateAuditLogDto } from './dto/create-audit-log.dto';

@Injectable()
export class AuditService {
  constructor(private prisma: PrismaService) {}

  async log(dto: CreateAuditLogDto) {
    return this.prisma.auditLog.create({ data: dto });
  }

  findAll(filters: {
    userEmail?: string;
    actionType?: string;
    entity?: string;
    from?: Date;
    to?: Date;
  }) {
    const where: any = {};
    if (filters.userEmail) where.userEmail = filters.userEmail;
    if (filters.actionType) where.actionType = filters.actionType as any;
    if (filters.entity) where.entity = filters.entity;
    if (filters.from || filters.to) {
      where.timestamp = {};
      if (filters.from) where.timestamp.gte = filters.from;
      if (filters.to) where.timestamp.lte = filters.to;
    }
    return this.prisma.auditLog.findMany({
      where,
      orderBy: { timestamp: 'desc' },
    });
  }
}
