import { Body, Controller, Post, Res, Req } from '@nestjs/common';
import { LabelsService } from './labels.service';
import { PrintLabelsDto } from './dto/print-labels.dto';
import { PrintPackVariantsDto } from './dto/print-pack-variants.dto';
import { Response } from 'express';
import { AuditService } from '../audit/audit.service';
import { AuditActionType } from '@prisma/client';

@Controller('labels')
export class LabelsController {
  constructor(
    private readonly labelsService: LabelsService,
    private readonly audit: AuditService,
  ) {}

  @Post('print')
  async print(@Body() dto: PrintLabelsDto, @Res() res: Response, @Req() req: any) {
    const pdf = await this.labelsService.generatePdf(dto);
    res.setHeader('Content-Type', 'application/pdf');
    res.setHeader('Content-Disposition', 'attachment; filename="labels.pdf"');
    res.send(pdf);
    await this.audit.log({
      userId: req.user?.id ?? 'unknown',
      userEmail: req.user?.email ?? 'unknown',
      actionType: AuditActionType.ETIQUETA,
      entity: 'Etiqueta',
      details: `Impresión de ${dto.items.length} productos`,
    });
  }

  @Post('pack-variants/print')
  async printVariants(@Body() dto: PrintPackVariantsDto, @Res() res: Response, @Req() req: any) {
    const pdf = await this.labelsService.printPackVariantLabels(dto);
    res.setHeader('Content-Type', 'application/pdf');
    res.setHeader('Content-Disposition', 'attachment; filename="labels.pdf"');
    res.send(pdf);
    await this.audit.log({
      userId: req.user?.id ?? 'unknown',
      userEmail: req.user?.email ?? 'unknown',
      actionType: AuditActionType.ETIQUETA,
      entity: 'Etiqueta',
      details: `Impresión de ${dto.variants.length} variantes`,
    });
  }
}
