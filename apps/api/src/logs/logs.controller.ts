import { Body, Controller, Post, Logger } from '@nestjs/common';

@Controller('logs')
export class LogsController {
  private readonly logger = new Logger('ClientLog');

  @Post('client')
  logClient(@Body() body: any) {
    const { event, message, ...meta } = body || {};
    this.logger.warn({ event, message, meta });
    return { ok: true };
  }
}
