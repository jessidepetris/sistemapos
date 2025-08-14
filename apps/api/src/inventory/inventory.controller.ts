import { Body, Controller, Get, Param, Post, Req, Query } from '@nestjs/common';
import { InventoryService } from './inventory.service';
import { StartSessionDto } from './dto/start-session.dto';
import { ScanDto } from './dto/scan.dto';

@Controller('inventory/sessions')
export class InventoryController {
  constructor(private readonly service: InventoryService) {}

  @Post()
  start(@Req() req: any, @Body() dto: StartSessionDto) {
    return this.service.startSession(req.user?.id || 'anon', dto);
  }

  @Post(':id/scan')
  addScan(@Param('id') id: string, @Body() dto: ScanDto) {
    return this.service.addScan(id, dto);
  }

  @Get()
  list(
    @Query('page') page: string = '1',
    @Query('pageSize') pageSize: string = '100',
  ) {
    return this.service.listSessions(Number(page), Number(pageSize));
  }

  @Get(':id')
  get(@Param('id') id: string) {
    return this.service.getSession(id);
  }
}
