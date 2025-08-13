import { IsOptional, IsString } from 'class-validator';

export class StartInventoryDto {
  @IsOptional()
  @IsString()
  notes?: string;
}

