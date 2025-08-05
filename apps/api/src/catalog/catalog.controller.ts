import { Body, Controller, Get, Param, ParseIntPipe, Post } from '@nestjs/common';
import { CatalogService } from './catalog.service';
import { CreateCatalogOrderDto } from './dto/create-catalog-order.dto';

@Controller()
export class CatalogController {
  constructor(private readonly catalogService: CatalogService) {}

  @Get('catalog-products')
  listProducts() {
    return this.catalogService.listProducts();
  }

  @Post('catalog-orders')
  createOrder(@Body() dto: CreateCatalogOrderDto) {
    return this.catalogService.createOrder(dto);
  }

  @Get('my-orders/:clientId')
  getOrders(@Param('clientId', ParseIntPipe) clientId: number) {
    return this.catalogService.getClientOrders(clientId);
  }
}
