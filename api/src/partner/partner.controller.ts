import { Body, Controller, Get, Param, Post } from '@nestjs/common';
import { plainToInstance } from 'class-transformer';
import { validateOrReject } from 'class-validator';
import { CreatePartnerInvoiceDto } from './dto/create-partner-invoice.dto';
import { PartnerService } from './partner.service';

@Controller('partner')
export class PartnerController {
  constructor(private readonly partnerService: PartnerService) {}

  /**
   * 合作伙伴提交企业开票信息
   * 前台开票信息提交页使用
   */
  @Post('invoice')
  async submitInvoice(@Body() body: any) {
    const dto = plainToInstance(CreatePartnerInvoiceDto, body);
    await validateOrReject(dto);
    const invoice = await this.partnerService.submitInvoice(dto);
    return {
      code: 200,
      message: '开票信息已提交，等待审核',
      result: invoice,
    };
  }

  /**
   * 查询某用户最近一次开票信息及审核状态
   */
  @Get('invoice/:userId')
  async getLastInvoice(@Param('userId') userId: string) {
    const list = await this.partnerService.findByUser(Number(userId));
    const invoice = list[0] ?? null;
    return {
      code: 200,
      message: 'OK',
      result: invoice,
    };
  }
}

