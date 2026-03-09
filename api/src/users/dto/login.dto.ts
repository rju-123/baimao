import { IsMobilePhone, IsNotEmpty } from 'class-validator';

export class LoginDto {
  @IsMobilePhone('zh-CN')
  phone: string;

  @IsNotEmpty()
  code: string;
}

