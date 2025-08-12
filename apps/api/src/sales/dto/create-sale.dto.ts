import { Type } from 'class-transformer';
import { IsArray, IsEnum, IsInt, IsNumber, IsOptional, IsString, ValidateNested } from 'class-validator';
import { PaymentMethod, SaleType } from '@prisma/client';

export class CreateSaleItemDto {
  @IsInt()
  productId: number;

  @IsInt()
  quantity: number;

  @IsNumber()
  price: number;

  @IsNumber()
  discount: number;
}

export class CreateSaleDto {
  @IsString()
  customerName: string;

  @IsOptional()
  @IsInt()
  customerId?: number;

  @IsEnum(SaleType)
  type: SaleType;

  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => CreateSaleItemDto)
  items: CreateSaleItemDto[];

  @IsNumber()
  subtotal: number;

  @IsNumber()
  discount: number;

  @IsNumber()
  total: number;

  @IsEnum(PaymentMethod)
  paymentMethod: PaymentMethod;

  @IsNumber()
  paidAmount: number;

  @IsNumber()
  change: number;
}
