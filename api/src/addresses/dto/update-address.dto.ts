import { IsBoolean, IsNotEmpty, IsOptional, IsString } from 'class-validator';

export class UpdateAddressDto {
  @IsOptional()
  @IsString()
  @IsNotEmpty()
  receiverName?: string;

  @IsOptional()
  @IsString()
  @IsNotEmpty()
  receiverPhone?: string;

  @IsOptional()
  @IsString()
  @IsNotEmpty()
  region?: string;

  @IsOptional()
  @IsString()
  @IsNotEmpty()
  detail?: string;

  @IsOptional()
  @IsBoolean()
  isDefault?: boolean;
}

