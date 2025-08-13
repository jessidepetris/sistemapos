import { Controller, Post, Body, Get, Param, Req } from '@nestjs/common';
import { PackagingService } from './packaging.service';
import { CreatePackagingDto } from './dto/create-packaging.dto';
import { QuickPackDto } from './dto/quick-pack.dto';

@Controller('packaging')
export class PackagingController {
  constructor(private service: PackagingService) {}

  @Post()
  create(@Body() dto: CreatePackagingDto) {
    return this.service.create(dto);
  }

  @Get()
  findAll(@Param('status') status?: string) {
    return this.service.findAll(status);
  }

  @Get(':id')
  findOne(@Param('id') id: string) {
    return this.service.findOne(id);
  }

  @Post(':id/confirm')
  confirm(@Param('id') id: string) {
    return this.service.confirm(id);
  }

  @Post('quick')
  quick(@Body() dto: QuickPackDto, @Req() req: any) {
    return this.service.quickPack(dto, req.user?.id || 'anon');
  }
}
