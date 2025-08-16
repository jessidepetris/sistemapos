import {
  Body,
  Controller,
  Get,
  Param,
  Post,
  Res,
  UploadedFile,
  UseInterceptors,
} from '@nestjs/common';
import { BackupsService } from './backups.service';
import { FileInterceptor } from '@nestjs/platform-express';
import { Response } from 'express';
import type { Express } from 'express';

@Controller('backups')
export class BackupsController {
  constructor(private backupsService: BackupsService) {}

  @Post('create')
  create(@Body() body: { userId?: string; userEmail?: string }) {
    return this.backupsService.createBackup(body.userId, body.userEmail);
  }

  @Get()
  list() {
    return this.backupsService.listBackups();
  }

  @Get(':id/download')
  async download(@Param('id') id: string, @Res() res: Response) {
    const { record, filepath } = await this.backupsService.getBackup(id);
    res.setHeader(
      'Content-Disposition',
      `attachment; filename=${record.filename}`,
    );
    res.sendFile(filepath);
  }

  @Post('restore')
  @UseInterceptors(FileInterceptor('file'))
  restore(
    @UploadedFile() file: Express.Multer.File,
    @Body() body: { userId?: string; userEmail?: string },
  ) {
    return this.backupsService.restoreBackup(file, body.userId, body.userEmail);
  }
}

