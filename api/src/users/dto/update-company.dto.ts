import { IsInt, IsOptional, IsString } from 'class-validator';

export class UpdateCompanyDto {
  @IsInt()
  companyId: number;

  /**
   * 销售人员姓名（可选，用于在选择公司时一并更新）
   */
  @IsOptional()
  @IsString()
  name?: string;
}

