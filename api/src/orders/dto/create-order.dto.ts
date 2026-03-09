import { IsInt, IsNotEmpty, IsNumber, IsOptional, IsString, Min } from 'class-validator';

export class CreateOrderDto {
  @IsInt()
  userId: number;

  @IsOptional()
  @IsInt()
  companyId?: number;

  @IsInt()
  productId: number;

  @IsOptional()
  @IsString()
  customerName: string;

  @IsOptional()
  @IsString()
  customerPhone: string;

  @IsOptional()
  @IsString()
  customerCompany: string;

  @IsInt()
  @Min(1)
  quantity: number;

  @IsOptional()
  @IsNumber()
  couponDiscount?: number;
}

