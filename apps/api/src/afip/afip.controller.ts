import { Body, Controller, Get, Param, Post } from '@nestjs/common';
import { AfipQueueService } from './afip.queue.service';

@Controller('afip')
export class AfipController {
  constructor(private queue: AfipQueueService) {}

  @Post('enqueue')
  enqueue(@Body('saleId') saleId: string) {
    return this.queue.enqueue(saleId);
  }

  @Get('status/:invoiceId')
  status(@Param('invoiceId') id: string) {
    return this.queue.getStatus(id);
  }
}
