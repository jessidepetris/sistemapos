import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma.service';
import { CreateAuditLogDto } from './dto/create-audit-log.dto';

@Injectable()
export class AuditService {
  constructor(private prisma: PrismaService) {}

  async create(dto: CreateAuditLogDto) {
    return this.prisma.auditLog.create({ data: dto });
  }

  findAll() {
    return this.prisma.auditLog.findMany({ orderBy: { timestamp: 'desc' } });
  }
}
