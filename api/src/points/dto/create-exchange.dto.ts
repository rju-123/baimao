import { IsInt, IsNotEmpty, IsOptional, IsString, Min } from 'class-validator';

export class CreateExchangeDto {
  @IsInt()
  userId: number;

  @IsInt()
  itemId: number;

  @IsInt()
  @Min(1)
  quantity: number;

  @IsOptional()
  @IsString()
  @IsNotEmpty()
  addressSnapshot?: string;
}

