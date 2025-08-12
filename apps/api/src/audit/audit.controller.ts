import { Controller, Get, Post, Body, Query } from '@nestjs/common';
import { AuditService } from './audit.service';
import { CreateAuditLogDto } from './dto/create-audit-log.dto';

@Controller('audit-logs')
export class AuditController {
  constructor(private readonly auditService: AuditService) {}

  @Get()
  findAll(
    @Query('userEmail') userEmail?: string,
    @Query('actionType') actionType?: string,
    @Query('entity') entity?: string,
    @Query('from') from?: string,
    @Query('to') to?: string,
  ) {
    return this.auditService.findAll({
      userEmail,
      actionType,
      entity,
      from: from ? new Date(from) : undefined,
      to: to ? new Date(to) : undefined,
    });
  }

  @Post()
  create(@Body() dto: CreateAuditLogDto) {
    return this.auditService.log(dto);
  }
}
