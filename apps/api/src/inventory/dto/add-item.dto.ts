import { IsInt } from 'class-validator';

export class AddInventoryItemDto {
  @IsInt()
  productId: number;

  @IsInt()
  countedQty: number;
}

