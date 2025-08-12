import { Body, Controller, Get, Headers, Param, Post, Query, Req, Res } from '@nestjs/common';
import { CashSessionsService } from './cash-sessions.service';
import { Response } from 'express';

@Controller('cash-sessions')
export class CashSessionsController {
  constructor(private service: CashSessionsService) {}

  @Get()
  findAll(@Query() query: any) {
    return this.service.findAll(query);
  }

  @Get(':id')
  findOne(@Param('id') id: string) {
    return this.service.findOne(id);
  }

  @Get(':id/pdf')
  async pdf(@Param('id') id: string, @Res() res: Response) {
    const buffer = await this.service.generatePdf(id);
    res.set({ 'Content-Type': 'application/pdf' });
    res.send(buffer);
  }

  @Post('open')
  open(@Body() body: { cashRegisterId: string; openingAmount: number }, @Req() req: any) {
    return this.service.open(body.cashRegisterId, Number(body.openingAmount), req.user);
  }

  @Post('close/:id')
  close(
    @Param('id') id: string,
    @Body()
    body: {
      closingAmount?: number;
      counts?: { denomination: number; quantity: number }[];
      countedBy?: string;
      notes?: string;
    },
    @Req() req: any,
  ) {
    return this.service.close(
      id,
      Number(body.closingAmount ?? 0),
      req.user,
      body.counts,
      body.countedBy,
      body.notes,
    );
  }

  @Get('my/current')
  myCurrent(@Headers('x-user-id') userId?: string) {
    return this.service.currentForUser(userId || '');
  }

  @Get('my/last-closed')
  myLastClosed(@Headers('x-user-id') userId?: string) {
    return this.service.lastClosedForUser(userId || '');
  }

  @Post('close/preview')
  preview(@Body() body: { sessionId: string; closingAmount: number }) {
    return this.service.previewClose(body.sessionId, Number(body.closingAmount));
  }
}

