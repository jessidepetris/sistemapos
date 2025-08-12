import { Controller, Post, Body } from '@nestjs/common';
import { StockGuardService } from './stock-guard.service';

@Controller('stock-guard')
export class StockGuardController {
  constructor(private readonly stock: StockGuardService) {}

  @Post('plan')
  resolve(@Body() body: { variantId: string; qty: number }) {
    return this.stock.resolveVariantConsumption(body.variantId, body.qty);
  }
}
