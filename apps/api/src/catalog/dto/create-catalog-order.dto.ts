import { IsArray, IsInt, ValidateNested } from 'class-validator';
import { Type } from 'class-transformer';

class CatalogOrderItemDto {
  @IsInt()
  productId: number;

  @IsInt()
  quantity: number;
}

export class CreateCatalogOrderDto {
  @IsInt()
  clientId: number;

  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => CatalogOrderItemDto)
  items: CatalogOrderItemDto[];
}
