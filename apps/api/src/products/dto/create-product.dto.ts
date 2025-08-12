import {
  IsArray,
  IsBoolean,
  IsInt,
  IsNumber,
  IsObject,
  IsOptional,
  IsString,
} from 'class-validator';

export class CreateProductDto {
  @IsString()
  name: string;

  @IsString()
  description: string;

  @IsNumber()
  stock: number;

  @IsInt()
  minStock: number;

  @IsNumber()
  costARS: number;

  @IsOptional()
  @IsNumber()
  costUSD?: number;

  @IsNumber()
  priceARS: number;

  @IsOptional()
  @IsNumber()
  pricePerKg?: number;

  @IsString()
  unit: string;

  @IsString()
  category: string;

  @IsOptional()
  @IsString()
  subcategory?: string;

  @IsArray()
  @IsString({ each: true })
  barcodes: string[];

  @IsOptional()
  @IsObject()
  variants?: any;

  @IsBoolean()
  isBulk: boolean;

  @IsBoolean()
  isRefrigerated: boolean;

  @IsBoolean()
  requiresLabel: boolean;

  @IsOptional()
  @IsString()
  imageUrl?: string;
}
