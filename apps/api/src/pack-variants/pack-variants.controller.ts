import { Controller, Post, Body, Get, Query, Patch, Param, Res } from '@nestjs/common';
import { PackVariantsService } from './pack-variants.service';
import { CreatePackVariantDto } from './dto/create-pack-variant.dto';
import { UpdatePackVariantDto } from './dto/update-pack-variant.dto';
import { Response } from 'express';

@Controller('pack-variants')
export class PackVariantsController {
  constructor(private service: PackVariantsService) {}

  @Post()
  create(@Body() dto: CreatePackVariantDto) {
    return this.service.create(dto);
  }

  @Get()
  findMany(@Query('productId') productId?: string) {
    return this.service.findMany(productId);
  }

  @Patch(':id')
  update(@Param('id') id: string, @Body() dto: UpdatePackVariantDto) {
    return this.service.update(id, dto);
  }

  @Get(':id/label')
  async label(@Param('id') id: string, @Res() res: Response) {
    const pdf = await this.service.label(id);
    res.setHeader('Content-Type', 'application/pdf');
    res.send(pdf);
  }
}
