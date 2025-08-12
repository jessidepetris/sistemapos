import { IsArray, IsInt, IsNumber, IsOptional, IsString, ValidateNested } from 'class-validator';
import { Type } from 'class-transformer';

class QuotationItemDto {
  @IsInt()
  productId: number;

  @IsInt()
  quantity: number;

  @IsNumber()
  price: number;

  @IsNumber()
  discount: number;
}

export class CreateQuotationDto {
  @IsOptional()
  @IsInt()
  clientId?: number;

  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => QuotationItemDto)
  items: QuotationItemDto[];

  @IsNumber()
  total: number;

  @IsOptional()
  @IsString()
  notes?: string;
}
