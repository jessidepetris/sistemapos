import { Controller, Get, Post, Body, Param } from '@nestjs/common';
import { PurchasesService } from './purchases.service';
import { CreatePurchaseDto } from './dto/create-purchase.dto';
import { CreatePaymentDto } from './dto/create-payment.dto';

@Controller('purchases')
export class PurchasesController {
  constructor(private readonly purchasesService: PurchasesService) {}

  @Post()
  create(@Body() dto: CreatePurchaseDto) {
    return this.purchasesService.create(dto);
  }

  @Get()
  findAll() {
    return this.purchasesService.findAll();
  }

  @Post(':id/payments')
  recordPayment(@Param('id') id: string, @Body() dto: CreatePaymentDto) {
    return this.purchasesService.recordPayment(id, dto);
  }
}
