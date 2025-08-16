import {
  Body,
  Controller,
  ForbiddenException,
  Get,
  Headers,
  Post,
  Query,
  UploadedFile,
  UseInterceptors,
} from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import { ImportsService } from './imports.service';
import { ImportProductDto } from './dto/import-product.dto';
import type { Express } from 'express';

@Controller()
export class ImportsController {
  constructor(private readonly service: ImportsService) {}

  @Post('importar-productos')
  @UseInterceptors(FileInterceptor('file'))
  parse(
    @UploadedFile() file: Express.Multer.File,
    @Query('fast') fast?: string,
    @Headers('x-user-id') userId?: string,
    @Headers('x-user-role') role?: string,
  ) {
    if (role !== 'ADMIN') throw new ForbiddenException();
    return this.service.parse(
      file,
      fast === 'true' || fast === '1',
      userId ? Number(userId) : undefined,
    );
  }

  @Post('importar-productos/confirmar')
  confirm(
    @Body() body: { products: ImportProductDto[]; filename?: string },
    @Headers('x-user-id') userId?: string,
    @Headers('x-user-role') role?: string,
  ) {
    if (role !== 'ADMIN') throw new ForbiddenException();
    return this.service.confirm(
      body.products || [],
      userId ? Number(userId) : undefined,
      body.filename,
    );
  }

  @Get('importar-productos/logs')
  logs(
    @Query('from') from?: string,
    @Query('to') to?: string,
    @Query('user') user?: string,
    @Headers('x-user-role') role?: string,
  ) {
    if (role !== 'ADMIN') throw new ForbiddenException();
    return this.service.listLogs(from, to, user);
  }
}
