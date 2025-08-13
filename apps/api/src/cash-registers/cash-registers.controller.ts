import { Controller, Get, Post, Body, Patch, Param, Delete } from '@nestjs/common';
import { CashRegistersService } from './cash-registers.service';

@Controller('cash-registers')
export class CashRegistersController {
  constructor(private service: CashRegistersService) {}

  @Get()
  findAll() {
    return this.service.findAll();
  }

  @Post()
  create(@Body() body: any) {
    return this.service.create(body);
  }

  @Patch(':id')
  update(@Param('id') id: string, @Body() body: any) {
    return this.service.update(id, body);
  }

  @Delete(':id')
  remove(@Param('id') id: string) {
    return this.service.remove(id);
  }
}

