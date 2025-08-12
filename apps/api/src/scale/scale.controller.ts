import { Controller, Post, Body, Get, Param } from '@nestjs/common';
import { ScaleService } from './scale.service';
import { ScaleEncoding } from '@prisma/client';

@Controller('scale-plus')
export class ScaleController {
  constructor(private service: ScaleService) {}

  @Post()
  create(@Body() dto: { plu: string; productId: number; encoding: ScaleEncoding }) {
    return this.service.create(dto);
  }

  @Get()
  findAll() {
    return this.service.findAll();
  }

  @Get('parse/:code')
  parse(@Param('code') code: string) {
    return this.service.parseBarcode(code);
  }
}
