import { Body, Controller, Headers, Post } from '@nestjs/common';
import { PaymentsService } from './payments.service';

@Controller('webhooks')
export class WebhooksController {
  constructor(private payments: PaymentsService) {}

  @Post('mp')
  async mp(@Body() body: any, @Headers('x-token') token?: string) {
    if (process.env.MP_WEBHOOK_SECRET && token !== process.env.MP_WEBHOOK_SECRET) {
      return { ok: true };
    }
    const id = body.data?.id;
    if (id) {
      await this.payments.refreshStatus(body.data.id);
    }
    return { received: true };
  }

  @Post('getnet')
  async getnet(@Body() body: any, @Headers('x-token') token?: string) {
    if (process.env.GETNET_WEBHOOK_SECRET && token !== process.env.GETNET_WEBHOOK_SECRET) {
      return { ok: true };
    }
    const id = body.paymentId;
    if (id) {
      await this.payments.refreshStatus(id);
    }
    return { received: true };
  }
}
