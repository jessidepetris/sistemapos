import { Body, Controller, Get, Post, UploadedFile, UseInterceptors } from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import { PricingService } from './pricing.service';

@Controller()
export class PricingController {
  constructor(private readonly service: PricingService) {}

  @Post('bulk-price-update')
  @UseInterceptors(FileInterceptor('file'))
  bulkUpdate(@UploadedFile() file: Express.Multer.File) {
    return this.service.bulkPriceUpdate(file);
  }

  @Get('price-watcher/run')
  runWatcher() {
    return this.service.runWatcher();
  }

  @Post('price-watcher/apply')
  apply(@Body() body: { suggestions: any[] }) {
    return this.service.applySuggestions(body.suggestions || []);
  }
}

