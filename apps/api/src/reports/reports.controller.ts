import { Controller, Get, Query, Res } from '@nestjs/common';
import { ReportsService } from './reports.service';
import { Response } from 'express';
import * as ExcelJS from 'exceljs';
import PDFDocument from 'pdfkit';

@Controller('reports')
export class ReportsController {
  constructor(private readonly reportsService: ReportsService) {}

  @Get('sales')
  async sales(@Query('from') from: string, @Query('to') to: string, @Query('format') format: string, @Res() res: Response) {
    const data = await this.reportsService.salesReport(from, to);
    if (format === 'excel') {
      const workbook = new ExcelJS.Workbook();
      const sheet = workbook.addWorksheet('Sales');
      sheet.addRow(['Total', data.totalSales]);
      sheet.addRow([]);
      sheet.addRow(['Client', 'Total']);
      Object.entries(data.byClient).forEach(([k, v]) => sheet.addRow([k, v]));
      const buffer = await workbook.xlsx.writeBuffer();
      res.setHeader('Content-Type', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet');
      res.setHeader('Content-Disposition', 'attachment; filename="sales-report.xlsx"');
      return res.send(buffer);
    }
    if (format === 'pdf') {
      const doc = new PDFDocument();
      const chunks: Buffer[] = [];
      doc.text(`Total Sales: ${data.totalSales}`);
      doc.end();
      doc.on('data', (c) => chunks.push(c));
      doc.on('end', () => {
        const pdf = Buffer.concat(chunks);
        res.setHeader('Content-Type', 'application/pdf');
        res.setHeader('Content-Disposition', 'attachment; filename="sales-report.pdf"');
        res.end(pdf);
      });
      return;
    }
    return res.json(data);
  }

  @Get('accounts-receivable')
  async accounts(@Query('format') format: string, @Res() res: Response) {
    const data = await this.reportsService.accountsReceivableReport();
    if (format === 'excel') {
      const workbook = new ExcelJS.Workbook();
      const sheet = workbook.addWorksheet('Accounts');
      sheet.addRow(['Client', 'Balance', 'Last Payment', 'Overdue']);
      data.forEach((r) =>
        sheet.addRow([r.clientName, r.balance, r.lastPayment, r.overdue])
      );
      const buffer = await workbook.xlsx.writeBuffer();
      res.setHeader('Content-Type', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet');
      res.setHeader('Content-Disposition', 'attachment; filename="accounts-report.xlsx"');
      return res.send(buffer);
    }
    if (format === 'pdf') {
      const doc = new PDFDocument();
      const chunks: Buffer[] = [];
      data.forEach((r) => doc.text(`${r.clientName}: ${r.balance}`));
      doc.end();
      doc.on('data', (c) => chunks.push(c));
      doc.on('end', () => {
        const pdf = Buffer.concat(chunks);
        res.setHeader('Content-Type', 'application/pdf');
        res.setHeader('Content-Disposition', 'attachment; filename="accounts-report.pdf"');
        res.end(pdf);
      });
      return;
    }
    return res.json(data);
  }

  @Get('stock')
  async stock(@Query('format') format: string, @Res() res: Response) {
    const data = await this.reportsService.stockReport();
    if (format === 'excel') {
      const workbook = new ExcelJS.Workbook();
      const sheet = workbook.addWorksheet('Stock');
      sheet.addRow(['Product', 'Stock', 'MinStock']);
      data.lowStock.forEach((p) => sheet.addRow([p.name, p.stock, p.minStock]));
      const buffer = await workbook.xlsx.writeBuffer();
      res.setHeader('Content-Type', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet');
      res.setHeader('Content-Disposition', 'attachment; filename="stock-report.xlsx"');
      return res.send(buffer);
    }
    if (format === 'pdf') {
      const doc = new PDFDocument();
      const chunks: Buffer[] = [];
      data.lowStock.forEach((p) => doc.text(`${p.name}: ${p.stock}`));
      doc.end();
      doc.on('data', (c) => chunks.push(c));
      doc.on('end', () => {
        const pdf = Buffer.concat(chunks);
        res.setHeader('Content-Type', 'application/pdf');
        res.setHeader('Content-Disposition', 'attachment; filename="stock-report.pdf"');
        res.end(pdf);
      });
      return;
    }
    return res.json(data);
  }

  @Get('deliveries')
  async deliveries(@Query('status') status: string, @Query('format') format: string, @Res() res: Response) {
    const data = await this.reportsService.deliveriesReport(status);
    if (format === 'excel') {
      const workbook = new ExcelJS.Workbook();
      const sheet = workbook.addWorksheet('Deliveries');
      sheet.addRow(['ID', 'Status']);
      data.deliveries.forEach((d) => sheet.addRow([d.id, d.status]));
      const buffer = await workbook.xlsx.writeBuffer();
      res.setHeader('Content-Type', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet');
      res.setHeader('Content-Disposition', 'attachment; filename="deliveries-report.xlsx"');
      return res.send(buffer);
    }
    if (format === 'pdf') {
      const doc = new PDFDocument();
      const chunks: Buffer[] = [];
      data.deliveries.forEach((d) => doc.text(`${d.id}: ${d.status}`));
      doc.end();
      doc.on('data', (c) => chunks.push(c));
      doc.on('end', () => {
        const pdf = Buffer.concat(chunks);
        res.setHeader('Content-Type', 'application/pdf');
        res.setHeader('Content-Disposition', 'attachment; filename="deliveries-report.pdf"');
        res.end(pdf);
      });
      return;
    }
    return res.json(data);
  }

  @Get('settlements/summary')
  settlementSummary(
    @Query('from') from: string,
    @Query('to') to: string,
    @Query('gateway') gateway: string,
  ) {
    return this.reportsService.settlementSummary(from, to, gateway);
  }
}
