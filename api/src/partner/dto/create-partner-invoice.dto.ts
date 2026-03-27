import { IsInt, IsNotEmpty, IsString } from 'class-validator';

export class CreatePartnerInvoiceDto {
  @IsInt()
  userId: number;

  /** 销售人员姓名（“你的姓名”） */
  @IsString()
  @IsNotEmpty()
  salesName: string;

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
  @IsNotEmpty()
  invoiceImagePath: string;
}

