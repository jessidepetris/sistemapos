import { IsInt } from 'class-validator';

export class UpdateInventoryItemDto {
  @IsInt()
  countedQty: number;
}

