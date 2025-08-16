import {
  Body,
  Controller,
  Get,
  Post,
  Query,
  Req,
  UseGuards,
} from '@nestjs/common';
import { CashSessionsService } from '../cash-sessions/cash-sessions.service';
import { CashMovementsService } from '../cash-movements/cash-movements.service';
import { CashMovementType, PaymentMethod } from '@prisma/client';
import { Permissions } from '../auth/permissions.decorator';
import { PermissionsGuard } from '../auth/permissions.guard';

@UseGuards(PermissionsGuard)
@Controller('cash-register')
export class CashRegisterController {
  constructor(
    private sessions: CashSessionsService,
    private movements: CashMovementsService,
  ) {}

  @Post('open')
  @Permissions('canOpenCash')
  open(@Body() body: any, @Req() req: any) {
    return this.sessions.open(
      body.cashRegisterId,
      Number(body.openingAmount || 0),
      req.user,
    );
  }

  @Post('closure-x')
  @Permissions('canCloseCash')
  closureX(@Body() body: any, @Req() req: any) {
    return this.sessions.closureX(body.sessionId, req.user, body.notes);
  }

  @Post('close')
  @Permissions('canCloseCash')
  close(@Body() body: any, @Req() req: any) {
    return this.sessions.close(
      body.sessionId,
      Number(body.closingAmount || 0),
      req.user,
    );
  }

  @Post('close/preview')
  preview(@Body() body: any) {
    return this.sessions.previewClose(body.sessionId, Number(body.closingAmount || 0));
  }

  @Get('current')
  current(@Req() req: any) {
    return this.sessions.currentForUser(req.user?.id || '');
  }

  @Post('movement')
  @Permissions('canCashMovement')
  movement(@Body() body: any, @Req() req: any) {
    return this.movements.create({
      sessionId: body.sessionId,
      type: body.type as CashMovementType,
      paymentMethod: body.method as PaymentMethod,
      amount: Number(body.amount),
      concept: body.description,
      user: req.user,
    });
  }

  @Get('closures')
  closures(@Query('from') from?: string, @Query('to') to?: string) {
    return this.sessions.listClosures({
      from: from ? new Date(from) : undefined,
      to: to ? new Date(to) : undefined,
    });
  }
}
