import { Body, Controller, Post, Res } from '@nestjs/common';
import { LabelsService } from './labels.service';
import { PrintLabelsDto } from './dto/print-labels.dto';
import { Response } from 'express';

@Controller('labels')
export class LabelsController {
  constructor(private readonly labelsService: LabelsService) {}

  @Post('print')
  async print(@Body() dto: PrintLabelsDto, @Res() res: Response) {
    const pdf = await this.labelsService.generatePdf(dto);
    res.setHeader('Content-Type', 'application/pdf');
    res.setHeader('Content-Disposition', 'attachment; filename="labels.pdf"');
    res.send(pdf);
  }
}
