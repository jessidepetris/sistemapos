import { IsArray, IsEnum, IsNumber, IsOptional, IsString, ValidateNested } from 'class-validator';
import { Type } from 'class-transformer';
import { PriceMode } from '@prisma/client';

class KitComponentDto {
  @IsNumber()
  componentId: number;

  @IsNumber()
  quantity: number;
}

export class CreateKitDto {
  @IsString()
  name: string;

  @IsString()
  description: string;

  @IsOptional()
  @IsString()
  kitBarcode?: string;

  @IsEnum(PriceMode)
  priceMode: PriceMode;

  @IsOptional()
  @IsNumber()
  priceARS?: number;

  @IsString()
  unit: string;

  @IsString()
  category: string;

  @IsOptional()
  @IsString()
  subcategory?: string;

  @IsOptional()
  @IsString()
  imageUrl?: string;

  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => KitComponentDto)
  components: KitComponentDto[];
}
