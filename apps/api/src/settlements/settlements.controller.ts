import {
  Body,
  Controller,
  Get,
  Param,
  Post,
  Query,
  Res,
  UploadedFile,
  UseInterceptors,
} from '@nestjs/common';
import { SettlementsService } from './settlements.service';
import { Response } from 'express';
import * as ExcelJS from 'exceljs';
import { SettlementGateway, SettlementStatus } from '@prisma/client';
import { FileInterceptor } from '@nestjs/platform-express';
import type { Express } from 'express';

@Controller('settlements')
export class SettlementsController {
  constructor(private service: SettlementsService) {}

  @Get()
  list(
    @Query('gateway') gateway?: SettlementGateway,
    @Query('status') status?: SettlementStatus,
    @Query('page') page: string = '1',
    @Query('pageSize') pageSize: string = '100',
  ) {
    return this.service.list(
      gateway,
      status,
      Number(page),
      Number(pageSize),
    );
  }

  @Get('summary/range')
  summaryRange(
    @Query('from') from: string,
    @Query('to') to: string,
    @Query('gateway') gateway?: SettlementGateway,
  ) {
    return this.service.summary(from, to, gateway);
  }

  @Post('run')
  run(@Body() body: { gateway: SettlementGateway; from: string; to: string }) {
    return this.service.run(body.gateway, body.from, body.to);
  }

  @Post('import-csv')
  @UseInterceptors(FileInterceptor('file'))
  importCsv(
    @UploadedFile() file: Express.Multer.File,
    @Body()
    body: {
      gateway: SettlementGateway;
      periodStart?: string;
      periodEnd?: string;
    },
  ) {
    return this.service.importCsv(
      body.gateway,
      file.buffer,
      body.periodStart,
      body.periodEnd,
    );
  }

  @Get(':id')
  get(@Param('id') id: string) {
    return this.service.get(id);
  }

  @Post(':id/retry')
  retry(@Param('id') id: string) {
    return this.service.retry(id);
  }

  @Post(':id/match')
  match(@Param('id') id: string) {
    return this.service.match(id);
  }

  @Get(':id/export')
  async export(@Param('id') id: string, @Res() res: Response) {
    const settlement = await this.service.get(id);
    if (!settlement) return res.status(404).end();
    const wb = new ExcelJS.Workbook();
    const sheet = wb.addWorksheet('Records');
    sheet.addRow([
      'settledAt',
      'externalId',
      'saleId',
      'gross',
      'fee',
      'net',
      'chargeback',
      'refund',
      'matchStatus',
    ]);
    settlement.records.forEach((r) =>
      sheet.addRow([
        r.settledAt,
        r.externalId,
        r.saleId,
        r.grossAmount,
        r.feeAmount,
        r.netAmount,
        r.chargeback,
        r.refundAmount || 0,
        r.matchStatus,
      ]),
    );
    const summary = wb.addWorksheet('Resumen');
    const gross = settlement.records.reduce((s, r) => s + Number(r.grossAmount), 0);
    const fee = settlement.records.reduce((s, r) => s + Number(r.feeAmount), 0);
    const net = settlement.records.reduce((s, r) => s + Number(r.netAmount), 0);
    const refunds = settlement.records.reduce((s, r) => s + Number(r.refundAmount || 0), 0);
    const chargebacks = settlement.records.filter((r) => r.chargeback).length;
    summary.addRow(['gross', gross]);
    summary.addRow(['fees', fee]);
    summary.addRow(['refunds', refunds]);
    summary.addRow(['chargebacks', chargebacks]);
    summary.addRow(['net', net]);
    const buffer = await wb.xlsx.writeBuffer();
    res.setHeader(
      'Content-Type',
      'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
    );
    res.setHeader('Content-Disposition', 'attachment; filename="settlement.xlsx"');
    res.send(buffer);
  }
}
