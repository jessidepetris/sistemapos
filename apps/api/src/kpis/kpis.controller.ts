import { Controller, Get, Query, UseInterceptors, CacheInterceptor } from '@nestjs/common';
import { KpisService } from './kpis.service';

@Controller('kpis')
@UseInterceptors(CacheInterceptor)
export class KpisController {
  constructor(private readonly kpisService: KpisService) {}

  @Get('sales')
  sales(@Query('granularity') granularity: string, @Query('from') from?: string, @Query('to') to?: string) {
    return this.kpisService.sales(granularity, from, to);
  }

  @Get('margin')
  margin(@Query('granularity') granularity: string, @Query('from') from?: string, @Query('to') to?: string) {
    return this.kpisService.margin(granularity, from, to);
  }

  @Get('ticket-avg')
  ticketAvg(@Query('from') from?: string, @Query('to') to?: string) {
    return this.kpisService.ticketAvg(from, to);
  }

  @Get('top-products')
  topProducts(
    @Query('metric') metric = 'sales',
    @Query('limit') limit = '10',
    @Query('from') from?: string,
    @Query('to') to?: string,
  ) {
    return this.kpisService.topProducts(metric, Number(limit), from, to);
  }

  @Get('top-clients')
  topClients(
    @Query('metric') metric = 'sales',
    @Query('limit') limit = '10',
    @Query('from') from?: string,
    @Query('to') to?: string,
  ) {
    return this.kpisService.topClients(metric, Number(limit), from, to);
  }

  @Get('payments-mix')
  paymentsMix(@Query('from') from?: string, @Query('to') to?: string) {
    return this.kpisService.paymentsMix(from, to);
  }

  @Get('receivables')
  receivables(@Query('aging') aging: string) {
    const buckets = aging ? aging.split(',').map((n) => parseInt(n, 10)) : [30, 60, 90];
    return this.kpisService.receivables(buckets);
  }

  @Get('purchases-cost')
  purchasesCost(@Query('from') from?: string, @Query('to') to?: string) {
    return this.kpisService.purchasesCost(from, to);
  }

  @Get('stock-coverage')
  stockCoverage() {
    return this.kpisService.stockCoverage();
  }

  @Get('margin-net')
  marginNet(@Query('from') from?: string, @Query('to') to?: string) {
    return this.kpisService.marginNet(from, to);
  }

  @Get('margin-net/series')
  marginNetSeries(
    @Query('granularity') granularity = 'day',
    @Query('from') from?: string,
    @Query('to') to?: string,
  ) {
    return this.kpisService.marginNetSeries(granularity, from, to);
  }
}
