import { Type } from 'class-transformer';
import { IsArray, IsBoolean, IsInt, IsNumber, IsOptional, IsString, ValidateNested } from 'class-validator';

class ReceiptItemDto {
  @IsInt()
  productId: number;

  @IsInt()
  receivedQty: number;

  @IsNumber()
  unitCost: number;
}

export class ReceivePurchaseDto {
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => ReceiptItemDto)
  items: ReceiptItemDto[];

  @IsOptional()
  @IsString()
  notes?: string;

  @IsOptional()
  @IsBoolean()
  printLabels?: boolean;
}
