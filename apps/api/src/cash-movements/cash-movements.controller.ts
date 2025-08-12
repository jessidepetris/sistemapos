import { Body, Controller, Get, Param, Post, Req } from '@nestjs/common';
import { CashMovementsService } from './cash-movements.service';
import { CashMovementType, PaymentMethod } from '@prisma/client';

@Controller('cash-movements')
export class CashMovementsController {
  constructor(private service: CashMovementsService) {}

  @Post()
  create(@Body() body: any, @Req() req: any) {
    return this.service.create({
      sessionId: body.sessionId,
      type: body.type as CashMovementType,
      paymentMethod: body.paymentMethod as PaymentMethod,
      amount: Number(body.amount),
      concept: body.concept,
      relatedSaleId: body.relatedSaleId,
      relatedPurchaseId: body.relatedPurchaseId,
      user: req.user,
    });
  }

  @Get(':sessionId')
  list(@Param('sessionId') sessionId: string) {
    return this.service.listBySession(sessionId);
  }
}

