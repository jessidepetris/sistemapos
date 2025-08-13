import { IsString, IsNumber, IsEnum, IsOptional, IsBoolean } from 'class-validator';
import { PackPriceMode, VariantConsumeMode } from '@prisma/client';

export class UpdatePackVariantDto {
  @IsOptional()
  @IsString()
  name?: string;

  @IsOptional()
  @IsNumber()
  contentKg?: number;

  @IsOptional()
  @IsEnum(PackPriceMode)
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
  @IsNumber()
  stockPacks?: number;

  @IsOptional()
  @IsEnum(VariantConsumeMode)
  consumeMode?: VariantConsumeMode;

  @IsOptional()
  @IsNumber()
  avgCostArs?: number;
}
