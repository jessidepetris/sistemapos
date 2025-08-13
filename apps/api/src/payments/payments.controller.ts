import { Body, Controller, Get, Param, Post } from '@nestjs/common';
import { PaymentsService } from './payments.service';

@Controller('payments')
export class PaymentsController {
  constructor(private payments: PaymentsService) {}

  @Post('mp/create')
  createMp(@Body() body: { saleId: string; amount: number; description: string; customer?: { email?: string; name?: string } }) {
    return this.payments.createMercadoPago(body);
  }

  @Post('getnet/create')
  createGetnet(@Body() body: { saleId: string; amount: number; description: string }) {
    return this.payments.createGetnet(body);
  }

  @Get(':id/status')
  status(@Param('id') id: string) {
    return this.payments.refreshStatus(id);
  }
}
