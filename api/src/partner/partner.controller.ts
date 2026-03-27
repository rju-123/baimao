import { Body, Controller, Get, Param, Post } from '@nestjs/common';
import { plainToInstance } from 'class-transformer';
import { validateOrReject } from 'class-validator';
import { CreatePartnerInvoiceDto } from './dto/create-partner-invoice.dto';
import { PartnerService } from './partner.service';

@Controller('partner')
export class PartnerController {
  constructor(private readonly partnerService: PartnerService) {}

  /**
   * 合作伙伴提交企业开票信息，同步到 fa_company 表（status=pending）
   */
  @Post('invoice')
  async submitInvoice(@Body() body: any) {
    // 兼容前端请求体可能为 `{ data: {...} }` 或直接 `{...}`
    const payload = body?.data ?? body;
    const rawUserId = Number(payload?.userId ?? 0);
    const safeUserId = Number.isFinite(rawUserId) && rawUserId > 0 && rawUserId <= 4294967295
      ? Math.floor(rawUserId)
      : 0;
    const normalized = {
      userId: safeUserId,
      salesName: String(payload?.salesName ?? '').trim(),
      companyName: String(payload?.companyName ?? '').trim(),
      contactName: String(payload?.contactName ?? '').trim(),
      contactPhone: String(payload?.contactPhone ?? '').trim(),
      registeredAddress: String(payload?.registeredAddress ?? '').trim(),
      taxNo: String(payload?.taxNo ?? '').trim(),
      bankName: String(payload?.bankName ?? '').trim(),
      bankAccount: String(payload?.bankAccount ?? '').trim(),
      invoiceImagePath: String(payload?.invoiceImagePath ?? '').trim(),
    };

    const dto = plainToInstance(CreatePartnerInvoiceDto, normalized);
    try {
      await validateOrReject(dto);
    }
    catch {
      return {
        code: 400,
        message: '参数校验失败，请检查开票信息是否填写完整且格式正确',
        result: null,
      };
    }

    const company = await this.partnerService.submitInvoice(dto);
    return {
      code: 200,
      message: '开票信息已提交，等待审核',
      result: company,
    };
  }

  /**
   * 查询某用户最近一次开票信息及审核状态
   */
  @Get('invoice/:userId')
  async getLastInvoice(@Param('userId') userId: string) {
    const invoice = await this.partnerService.findByUser(Number(userId));
    return {
      code: 200,
      message: 'OK',
      result: invoice,
    };
  }

  /**
   * 审核通过：后台调用，或供 NestJS 内部使用
   */
  @Post('approve/:companyId')
  async approve(@Param('companyId') companyId: string) {
    const ok = await this.partnerService.approve(Number(companyId));
    return {
      code: ok ? 200 : 400,
      message: ok ? '审核通过' : '审核失败或该记录已处理',
      result: ok,
    };
  }

  /**
   * 审核驳回：后台调用
   */
  @Post('reject/:companyId')
  async reject(@Param('companyId') companyId: string) {
    const ok = await this.partnerService.reject(Number(companyId));
    return {
      code: ok ? 200 : 400,
      message: ok ? '已驳回' : '操作失败或该记录已处理',
      result: ok,
    };
  }

  /**
   * 用户放弃已驳回的公司申请，改以个人销售身份入驻
   */
  @Post('invoice/abandon')
  async abandonInvoice(@Body() body: any) {
    const userId = Number(body?.userId ?? body?.data?.userId ?? 0);
    if (!userId) {
      return {
        code: 400,
        message: '缺少 userId',
        result: false,
      };
    }
    const ok = await this.partnerService.abandonInvoice(userId);
    return {
      code: 200,
      message: ok ? '已放弃申请' : '无待放弃的申请记录',
      result: ok,
    };
  }
}

