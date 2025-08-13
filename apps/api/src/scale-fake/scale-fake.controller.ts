import { Controller, Post, Body, Req } from '@nestjs/common';
import { ScaleFakeService } from './scale-fake.service';
import { AuditService } from '../audit/audit.service';
import { AuditActionType } from '@prisma/client';

@Controller('scale-fake')
export class ScaleFakeController {
  constructor(private svc: ScaleFakeService, private audit: AuditService) {}

  @Post('for-variant')
  async generateForVariant(@Body() body: any, @Req() req: any) {
    const { variantId, ...opts } = body;
    const result = await this.svc.generateForVariant(variantId, opts);
    await this.audit.log({
      userId: req.user?.id ?? 'unknown',
      userEmail: req.user?.email ?? '',
      actionType: AuditActionType.SCALE_FAKE_GENERATE_ONE,
      entity: 'PackVariant',
      entityId: variantId,
      details: `Generó código fake`,
    });
    return result;
  }

  @Post('batch')
  async generateBatch(@Body() body: any, @Req() req: any) {
    const result = await this.svc.generateBatch(body.items || [], { persist: body.persist, zip: body.zip });
    await this.audit.log({
      userId: req.user?.id ?? 'unknown',
      userEmail: req.user?.email ?? '',
      actionType: AuditActionType.SCALE_FAKE_GENERATE_BATCH,
      entity: 'PackVariant',
      details: `Generó códigos fake batch (${(body.items || []).length})`,
    });
    return result;
  }

  @Post('reprint')
  async reprint(@Body() body: any, @Req() req: any) {
    const result = await this.svc.reprint(body.variants || [], body.useFakeOrBarcode);
    await this.audit.log({
      userId: req.user?.id ?? 'unknown',
      userEmail: req.user?.email ?? '',
      actionType: AuditActionType.SCALE_FAKE_REPRINT,
      entity: 'PackVariant',
      details: `Reimpresión etiquetas (${(body.variants || []).length})`,
    });
    return result;
  }
}
