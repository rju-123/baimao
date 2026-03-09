import { IsMobilePhone } from 'class-validator';

export class SendCodeDto {
  @IsMobilePhone('zh-CN')
  phone: string;
}

