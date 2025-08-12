import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  Patch,
  Post,
  Req,
} from '@nestjs/common';
import { InventoryService } from './inventory.service';
import { StartInventoryDto } from './dto/start-inventory.dto';
import { AddInventoryItemDto } from './dto/add-item.dto';
import { UpdateInventoryItemDto } from './dto/update-item.dto';

@Controller('inventory')
export class InventoryController {
  constructor(private readonly service: InventoryService) {}

  @Post('start')
  start(@Req() req: any, @Body() dto: StartInventoryDto) {
    return this.service.start(req.user?.id || 'anon', dto);
  }

  @Post(':id/add-item')
  addItem(
    @Req() req: any,
    @Param('id') id: string,
    @Body() dto: AddInventoryItemDto,
  ) {
    return this.service.addItem(id, dto, req.user?.id || 'anon');
  }

  @Patch(':id/update-item/:itemId')
  updateItem(
    @Req() req: any,
    @Param('id') id: string,
    @Param('itemId') itemId: string,
    @Body() dto: UpdateInventoryItemDto,
  ) {
    return this.service.updateItem(id, itemId, dto, req.user?.id || 'anon');
  }

  @Patch(':id/complete')
  complete(@Req() req: any, @Param('id') id: string) {
    return this.service.complete(id, req.user?.id || 'anon');
  }

  @Get()
  list() {
    return this.service.list();
  }

  @Get(':id')
  get(@Param('id') id: string) {
    return this.service.get(id);
  }

  @Delete(':id')
  cancel(@Param('id') id: string) {
    return this.service.cancel(id);
  }
}

