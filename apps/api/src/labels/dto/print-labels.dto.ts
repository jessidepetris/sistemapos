import { IsArray, IsInt, IsOptional, Min, ValidateNested } from 'class-validator';
import { Type } from 'class-transformer';

class LabelItemDto {
  @IsInt()
  productId: number;

  @IsInt()
  @Min(1)
  quantity: number;
}

export class PrintLabelsDto {
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => LabelItemDto)
  items: LabelItemDto[];

  @IsOptional()
  @IsInt()
  columns?: number;
}
