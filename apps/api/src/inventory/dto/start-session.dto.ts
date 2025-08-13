import { IsEnum, IsOptional, IsString } from 'class-validator';
import { InventoryScope } from '@prisma/client';

export class StartSessionDto {
  @IsString()
  name!: string;

  @IsEnum(InventoryScope)
  scope!: InventoryScope;

  @IsOptional()
  @IsString()
  storeId?: string;

  @IsOptional()
  @IsString()
  categoryId?: string;

  @IsOptional()
  @IsString()
  supplierId?: string;

  @IsOptional()
  @IsString()
  location?: string;

  @IsOptional()
  @IsString()
  notes?: string;
}
