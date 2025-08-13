import { Type } from 'class-transformer';
import { IsArray, IsEnum, IsInt, IsNumber, IsOptional, IsString, ValidateNested } from 'class-validator';
import { PaymentGateway, SaleType, PaymentStatus } from '@prisma/client';

export class CreateSaleItemDto {
  @IsInt()
  productId: number;

  @IsNumber()
  quantity: number;

  @IsNumber()
  price: number;

  @IsNumber()
  discount: number;

  @IsOptional()
  @IsString()
  variantId?: string;
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

  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => PaymentDto)
  payments: PaymentDto[];
}

export class PaymentDto {
  @IsEnum(PaymentGateway)
  gateway: PaymentGateway;

  @IsOptional()
  @IsString()
  methodLabel?: string;

  @IsNumber()
  amount: number;

  @IsOptional()
  @IsEnum(PaymentStatus)
  status?: PaymentStatus;
}
