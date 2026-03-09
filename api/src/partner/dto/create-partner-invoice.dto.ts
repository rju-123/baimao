import { IsInt, IsNotEmpty, IsString } from 'class-validator';

export class CreatePartnerInvoiceDto {
  @IsInt()
  userId: number;

  @IsString()
  @IsNotEmpty()
  companyName: string;

  @IsString()
  @IsNotEmpty()
  contactName: string;

  @IsString()
  @IsNotEmpty()
  contactPhone: string;

  @IsString()
  @IsNotEmpty()
  registeredAddress: string;

  @IsString()
  @IsNotEmpty()
  taxNo: string;

  @IsString()
  @IsNotEmpty()
  bankName: string;

  @IsString()
  @IsNotEmpty()
  bankAccount: string;

  @IsString()
  invoiceImagePath: string;
}

