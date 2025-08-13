import { IsArray, IsString, ValidateNested, IsInt, IsOptional, IsNumber } from 'class-validator';
import { Type } from 'class-transformer';

export class PackagingItemDto {
  @IsString()
  variantId: string;

  @IsInt()
  qtyToMake: number;

  @IsOptional()
  @IsNumber()
  wasteKg?: number;

  @IsOptional()
  @IsNumber()
  wastePct?: number;

  @IsOptional()
  @IsString()
  wasteReason?: string;
}

export class CreatePackagingDto {
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => PackagingItemDto)
  items: PackagingItemDto[];

  @IsString()
  createdBy: string;

  @IsString()
  notes?: string;
}
