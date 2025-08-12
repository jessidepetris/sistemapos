import { IsString, IsNumber, IsEnum, IsOptional, IsBoolean } from 'class-validator';
import { PackPriceMode, VariantConsumeMode } from '@prisma/client';

export class CreatePackVariantDto {
  @IsString()
  parentProductId: string;

  @IsString()
  name: string;

  @IsNumber()
  contentKg: number;

  @IsEnum(PackPriceMode)
  @IsOptional()
  priceMode?: PackPriceMode;

  @IsOptional()
  @IsNumber()
  fixedPrice?: number;

  @IsOptional()
  @IsString()
  barcode?: string;

  @IsOptional()
  @IsBoolean()
  requiresLabel?: boolean;

  @IsOptional()
  @IsEnum(VariantConsumeMode)
  consumeMode?: VariantConsumeMode;

  @IsOptional()
  @IsNumber()
  avgCostArs?: number;
}
