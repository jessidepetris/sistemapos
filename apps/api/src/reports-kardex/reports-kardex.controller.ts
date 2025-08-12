import { Controller, Get, Query, Res } from '@nestjs/common';
import { ReportsKardexService } from './reports-kardex.service';
import { Response } from 'express';
import * as ExcelJS from 'exceljs';

@Controller('reports/kardex')
export class ReportsKardexController {
  constructor(private service: ReportsKardexService) {}

  @Get()
  async list(
    @Query('productId') productId?: string,
    @Query('type') type?: string,
    @Query('from') from?: string,
    @Query('to') to?: string,
    @Query('page') page?: string,
    @Query('pageSize') pageSize?: string,
  ) {
    return this.service.findAll({ productId, type, from, to, page: Number(page), pageSize: Number(pageSize) });
  }

  @Get('export')
  async export(
    @Query('productId') productId: string,
    @Query('type') type: string,
    @Query('from') from: string,
    @Query('to') to: string,
    @Res() res: Response,
  ) {
    const data = await this.service.findAll({ productId, type, from, to, page: 1, pageSize: 5000 });
    const wb = new ExcelJS.Workbook();
    const sheet = wb.addWorksheet('Kardex');
    sheet.addRow(['Fecha', 'Producto', 'Tipo', 'Qty', 'Costo unit', 'Costo total', 'Ref', 'Notas']);
    data.rows.forEach((r) =>
      sheet.addRow([
        r.createdAt,
        r.productName,
        r.type,
        r.qty,
        r.unitCostArs,
        r.totalCostArs,
        r.refId ? `${r.refTable}:${r.refId}` : '',
        r.notes || '',
      ]),
    );
    const totalsSheet = wb.addWorksheet('Totales');
    totalsSheet.addRow(['qtyIn', data.totals.qtyIn]);
    totalsSheet.addRow(['qtyOut', data.totals.qtyOut]);
    totalsSheet.addRow(['costIn', data.totals.costIn]);
    totalsSheet.addRow(['costOut', data.totals.costOut]);
    const buffer = await wb.xlsx.writeBuffer();
    res.setHeader('Content-Type', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet');
    res.setHeader('Content-Disposition', 'attachment; filename="kardex.xlsx"');
    res.send(buffer);
  }
}
