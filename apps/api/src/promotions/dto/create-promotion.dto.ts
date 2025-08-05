import { IsBoolean, IsDateString, IsInt, IsNumber, IsOptional, IsString } from 'class-validator';

export class CreatePromotionDto {
  @IsString()
  name: string;

  @IsString()
  type: string;

  @IsOptional()
  @IsInt()
  productId?: number;

  @IsOptional()
  @IsString()
  categoryId?: string;

  @IsOptional()
  @IsString()
  clientType?: string;

  @IsOptional()
  @IsInt()
  minQuantity?: number;

  @IsOptional()
  @IsNumber()
  minTotal?: number;

  @IsOptional()
  @IsNumber()
  discountPercent?: number;

  @IsOptional()
  @IsInt()
  bonusQuantity?: number;

  @IsDateString()
  validFrom: string;

  @IsDateString()
  validTo: string;

  @IsOptional()
  @IsBoolean()
  active?: boolean;
}
