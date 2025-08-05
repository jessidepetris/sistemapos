import { QuotationStatus } from '@prisma/client';
import { IsEnum } from 'class-validator';

export class UpdateQuotationStatusDto {
  @IsEnum(QuotationStatus)
  status: QuotationStatus;
}
