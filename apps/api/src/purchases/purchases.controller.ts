import { Controller, Get, Post, Body, Param, Patch, Query, Res } from '@nestjs/common';
import { PurchasesService } from './purchases.service';
import { CreatePurchaseDto } from './dto/create-purchase.dto';
import { CreatePaymentDto } from './dto/create-payment.dto';
import { UpdatePurchaseDto } from './dto/update-purchase.dto';
import { Response } from 'express';
import { ReceivePurchaseDto } from './dto/receive-purchase.dto';

@Controller('purchases')
export class PurchasesController {
  constructor(private readonly purchasesService: PurchasesService) {}

  @Get('transit/summary')
  transitSummary() {
    return this.purchasesService.transitSummary();
  }

  @Get('transit/list')
  transitList(@Query() query: any) {
    return this.purchasesService.transitList(query);
  }

  @Post()
  create(@Body() dto: CreatePurchaseDto) {
    return this.purchasesService.create(dto);
  }

  @Get()
  findAll(@Query('status') status?: string) {
    // status filter not implemented in service; just return all for simplicity
    return this.purchasesService.findAll();
  }

  @Get(':id')
  findOne(@Param('id') id: string) {
    return this.purchasesService.findOne(id);
  }

  @Get(':id/receipts')
  receipts(@Param('id') id: string) {
    return this.purchasesService.receipts(id);
  }

  @Patch(':id')
  update(@Param('id') id: string, @Body() dto: UpdatePurchaseDto) {
    return this.purchasesService.update(id, dto);
  }

  @Post(':id/confirm')
  confirm(@Param('id') id: string) {
    return this.purchasesService.confirm(id);
  }

  @Get(':id/pdf')
  async pdf(@Param('id') id: string, @Res() res: Response) {
    const pdf = await this.purchasesService.pdf(id);
    res.setHeader('Content-Type', 'application/pdf');
    res.send(pdf);
  }

  @Get(':id/whatsapp-link')
  whatsapp(@Param('id') id: string) {
    return this.purchasesService.whatsappLink(id);
  }

  @Post(':id/receive')
  receive(@Param('id') id: string, @Body() dto: ReceivePurchaseDto) {
    return this.purchasesService.receive(id, dto);
  }

  @Post(':id/payments')
  recordPayment(@Param('id') id: string, @Body() dto: CreatePaymentDto) {
    return this.purchasesService.recordPayment(id, dto);
  }
}
