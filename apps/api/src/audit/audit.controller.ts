import { Controller, Get, Post, Body } from '@nestjs/common';
import { AuditService } from './audit.service';
import { CreateAuditLogDto } from './dto/create-audit-log.dto';

@Controller('audit-logs')
export class AuditController {
  constructor(private readonly auditService: AuditService) {}

  @Get()
  findAll() {
    return this.auditService.findAll();
  }

  @Post()
  create(@Body() dto: CreateAuditLogDto) {
    return this.auditService.create(dto);
  }
}
