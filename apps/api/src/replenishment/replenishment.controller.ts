import { Body, Controller, Get, Param, Patch, Post } from '@nestjs/common';
import { ReplenishmentService } from './replenishment.service';

@Controller('replenishment')
export class ReplenishmentController {
  constructor(private service: ReplenishmentService) {}

  @Post('run')
  run() {
    return this.service.run();
  }

  @Get(':batchId')
  getBatch(@Param('batchId') batchId: string) {
    return this.service.getBatch(batchId);
  }

  @Patch(':batchId/override')
  override(
    @Param('batchId') batchId: string,
    @Body() body: { overrides: any[] },
  ) {
    return this.service.override(batchId, body.overrides || []);
  }

  @Post(':batchId/create-drafts')
  createDrafts(@Param('batchId') batchId: string) {
    return this.service.createDrafts(batchId);
  }

  @Get('rules/list')
  rules() {
    return this.service.getRules();
  }

  @Post('rules')
  saveRule(@Body() body: any) {
    return this.service.upsertRule(body);
  }
}
