import { Controller, Post, Body } from '@nestjs/common';
import { BarcodesService } from './barcodes.service';
import { ScaleEncoding } from '@prisma/client';

@Controller('barcodes')
export class BarcodesController {
  constructor(private service: BarcodesService) {}

  @Post('pool/allocate')
  allocate(@Body() body: { count: number; notes?: string }) {
    return this.service.allocateInternalCodes(body.count, body.notes);
  }

  @Post('assign')
  assign(@Body() body: { variantId: string; type: 'INTERNAL' | 'FAKE'; copies?: number; print?: boolean; fake?: { scheme?: ScaleEncoding; prefix?: number; priceArs?: number; unitPriceArs?: number } }) {
    return this.service.assignAndPrint({ ...body });
  }

  @Post('release')
  release(@Body() body: { ean13: string; retire?: boolean }) {
    return this.service.release(body.ean13, body.retire);
  }
}
