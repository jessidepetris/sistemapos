import { Body, Controller, Get, Param, Post, Res } from '@nestjs/common';
import { AccountsService } from './accounts.service';
import { CreatePaymentDto } from './dto/create-payment.dto';
import { Response } from 'express';

@Controller('accounts')
export class AccountsController {
  constructor(private readonly accountsService: AccountsService) {}

  @Get(':clientId')
  getAccount(@Param('clientId') clientId: string) {
    return this.accountsService.getClientAccount(+clientId);
  }

  @Post(':clientId/payments')
  addPayment(
    @Param('clientId') clientId: string,
    @Body() dto: CreatePaymentDto,
  ) {
    return this.accountsService.recordPayment(+clientId, dto.amount, dto.description);
  }

  @Get(':clientId/pdf')
  async pdf(@Param('clientId') clientId: string, @Res() res: Response) {
    const buffer = await this.accountsService.generatePdf(+clientId);
    res.setHeader('Content-Type', 'application/pdf');
    res.send(buffer);
  }
}
