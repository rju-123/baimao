import { Body, Controller, Get, Param, Post } from '@nestjs/common';
import { plainToInstance } from 'class-transformer';
import { validateOrReject } from 'class-validator';
import { CompaniesService } from './companies.service';
import { CreateCompanyDto } from './dto/create-company.dto';

@Controller('companies')
export class CompaniesController {
  constructor(private readonly companiesService: CompaniesService) {}

  @Get()
  async list() {
    const data = await this.companiesService.findAll();
    return {
      code: 200,
      message: 'OK',
      result: data,
    };
  }

  @Post()
  async create(@Body() body: any) {
    // 兼容前端请求体可能为 `{ data: {...} }` 或直接 `{...}`
    const payload = body?.data ?? body;
    // 统一把可能的 number 字段转成 string，并去掉首尾空格，避免 class-validator 的类型校验失败
    const normalized = {
      name: String(payload?.name ?? '').trim(),
      creditCode: String(payload?.creditCode ?? '').trim(),
      address: String(payload?.address ?? '').trim(),
      contactName: String(payload?.contactName ?? '').trim(),
      contactPhone: String(payload?.contactPhone ?? '').trim(),
    };

    const dto = plainToInstance(CreateCompanyDto, normalized);
    try {
      await validateOrReject(dto);
    }
    catch {
      return {
        code: 400,
        message: '参数校验失败，请检查公司信息是否填写完整且格式正确',
        result: null,
      };
    }

    const company = await this.companiesService.create(dto);
    return {
      code: 200,
      message: '公司创建成功',
      result: company,
    };
  }

  /**
   * 公司看板概要：名称、团队人数、总订单数、公司优惠券数
   */
  @Get(':id/dashboard')
  async dashboard(@Param('id') id: string) {
    const companyId = Number(id);
    const data = await this.companiesService.getDashboard(companyId);
    if (!data) {
      return {
        code: 404,
        message: '公司不存在',
        result: null,
      };
    }
    return {
      code: 200,
      message: 'OK',
      result: data,
    };
  }

  /**
   * 公司成员列表：用于“我的公司-我的团队”
   */
  @Get(':id/members')
  async members(@Param('id') id: string) {
    const companyId = Number(id);
    const list = await this.companiesService.getMembers(companyId);
    return {
      code: 200,
      message: 'OK',
      result: list,
    };
  }

  /**
   * 移除公司成员：仅修改销售表中的 companyId / is_admin
   */
  @Post(':id/members/:memberId/remove')
  async removeMember(@Param('id') id: string, @Param('memberId') memberId: string) {
    const ok = await this.companiesService.removeMember(Number(id), Number(memberId));
    return {
      code: ok ? 200 : 404,
      message: ok ? '成员已移除' : '成员不存在或不属于该公司',
      result: ok,
    };
  }

  /**
   * 转交管理员身份给指定成员
   */
  @Post(':id/members/:memberId/transfer-admin')
  async transferAdmin(@Param('id') id: string, @Param('memberId') memberId: string) {
    const ok = await this.companiesService.transferAdmin(Number(id), Number(memberId));
    return {
      code: ok ? 200 : 404,
      message: ok ? '管理员已转交' : '成员不存在或不属于该公司',
      result: ok,
    };
  }
}

