import { IsInt } from 'class-validator';

export class UpdateCompanyDto {
  @IsInt()
  companyId: number;
}

