import {
  IsArray,
  IsBoolean,
  IsInt,
  IsNumber,
  IsObject,
  IsOptional,
  IsString,
} from 'class-validator';

export class UpdateProductDto {
  @IsOptional()
  @IsString()
  name?: string;

  @IsOptional()
  @IsString()
  description?: string;

  @IsOptional()
  @IsInt()
  stock?: number;

  @IsOptional()
  @IsInt()
  minStock?: number;

  @IsOptional()
  @IsNumber()
  costARS?: number;

  @IsOptional()
  @IsNumber()
  costUSD?: number;

  @IsOptional()
  @IsNumber()
  priceARS?: number;

  @IsOptional()
  @IsString()
  unit?: string;

  @IsOptional()
  @IsString()
  category?: string;

  @IsOptional()
  @IsString()
  subcategory?: string;

  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  barcodes?: string[];

  @IsOptional()
  @IsObject()
  variants?: any;

  @IsOptional()
  @IsBoolean()
  isBulk?: boolean;

  @IsOptional()
  @IsBoolean()
  isRefrigerated?: boolean;

  @IsOptional()
  @IsString()
  imageUrl?: string;

  @IsOptional()
  @IsBoolean()
  requiresLabel?: boolean;
}
