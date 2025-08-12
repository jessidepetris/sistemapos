import { Controller, Get, Param, Res } from '@nestjs/common';
import { Response } from 'express';
import { TicketsService } from './tickets.service';

@Controller('tickets')
export class TicketsController {
  constructor(private readonly ticketsService: TicketsService) {}

  @Get(':saleId/print')
  async print(@Param('saleId') saleId: string, @Res() res: Response) {
    const html = await this.ticketsService.generateHtml(saleId);
    res.setHeader('Content-Type', 'text/html');
    res.send(html);
  }
}

