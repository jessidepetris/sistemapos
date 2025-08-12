import { Body, Controller, Get, Param, Post, Query, Res } from '@nestjs/common';
import { SalesService } from './sales.service';
import { CreateSaleDto } from './dto/create-sale.dto';
import { Response } from 'express';

@Controller('sales')
export class SalesController {
  constructor(private readonly salesService: SalesService) {}

  @Post()
  create(@Body() body: CreateSaleDto) {
    return this.salesService.create(body);
  }

  @Get()
  findAll(
    @Query('from') from?: string,
    @Query('to') to?: string,
    @Query('customerId') customerId?: string,
    @Query('type') type?: any,
  ) {
    return this.salesService.findAll({
      from: from ? new Date(from) : undefined,
      to: to ? new Date(to) : undefined,
      customerId: customerId ? Number(customerId) : undefined,
      type,
    });
  }

  @Get(':id')
  findOne(@Param('id') id: string) {
    return this.salesService.findOne(id);
  }

  @Get(':id/pdf')
  async pdf(@Param('id') id: string, @Res() res: Response) {
    const buffer = await this.salesService.generatePdf(id);
    res.set({
      'Content-Type': 'application/pdf',
      'Content-Disposition': `attachment; filename="sale-${id}.pdf"`,
    });
    res.send(buffer);
  }
}
