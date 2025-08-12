import { Controller, Post, Param, Get, Res } from '@nestjs/common';
import { InvoicesService } from './invoices.service';
import { Response } from 'express';

@Controller('invoices')
export class InvoicesController {
  constructor(private readonly invoices: InvoicesService) {}

  @Post(':saleId/afip')
  afip(@Param('saleId') saleId: string) {
    return this.invoices.createAfipInvoice(saleId);
  }

  @Post(':saleId/retry')
  retry(@Param('saleId') saleId: string) {
    return this.invoices.retryAfip(saleId);
  }

  @Get(':saleId/status')
  status(@Param('saleId') saleId: string) {
    return this.invoices.status(saleId);
  }

  @Post(':saleId/remito-x')
  remito(@Param('saleId') saleId: string) {
    return this.invoices.generateRemito(saleId);
  }

  @Get(':id/pdf')
  async pdf(@Param('id') id: string, @Res() res: Response) {
    const pdf = await this.invoices.getPdf(id);
    res.setHeader('Content-Type', 'application/pdf');
    res.end(pdf);
  }
}
