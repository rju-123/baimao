import { Body, Controller, Get, Param, Post, Put } from '@nestjs/common';
import { plainToInstance } from 'class-transformer';
import { validateOrReject } from 'class-validator';
import { UsersService } from './users.service';
import { LoginDto } from './dto/login.dto';
import { UpdateCompanyDto } from './dto/update-company.dto';
import { SendCodeDto } from './dto/send-code.dto';
import { SalesService } from '../sales/sales.service';
import { CompaniesService } from '../companies/companies.service';
import { WechatService } from '../wechat/wechat.service';
import { User } from './user.entity';
import { Sales } from '../sales/sales.entity';

@Controller()
export class UsersController {
  constructor(
    private readonly usersService: UsersService,
    private readonly salesService: SalesService,
    private readonly companiesService: CompaniesService,
    private readonly wechatService: WechatService,
  ) {}

  /**
   * 发送登录验证码（模拟接口，不真正下发短信）
   */
  @Post('auth/send-code')
  async sendCode(@Body() body: any) {
    const dto = plainToInstance(SendCodeDto, body);
    await validateOrReject(dto);

    // 这里不真正发送短信，仅返回成功，前端固定使用 1234 作为测试验证码
    return {
      code: 200,
      message: '验证码发送成功（测试环境固定为 1234）',
      result: {
        expireIn: 300,
      },
    };
  }

  /**
   * 模拟登录：手机号 + 验证码（固定 1234），返回用户信息和简单 token
   */
  @Post('auth/login')
  async login(@Body() body: any) {
    let dto: LoginDto;
    try {
      dto = plainToInstance(LoginDto, body);
      await validateOrReject(dto);
    }
    catch {
      return {
        code: 400,
        message: '请填写正确的手机号和验证码',
      };
    }

    if (dto.code !== '1234') {
      return {
        code: 400,
        message: '验证码错误，当前仅支持测试验证码 1234',
      };
    }

    try {
      let user = await this.usersService.createIfNotExists(dto.phone);
      user = (await this.usersService.findById(user.id)) ?? user;
      let sales = await this.salesService.findByPhone(user.phone);
      if (!sales)
        sales = await this.salesService.findByLinkedUserId(user.id);
      const token = `mock-token-${user.id}`;
      const isAdmin = sales ? !!sales.isAdmin : user.isAdmin;

      return {
        code: 200,
        message: '登录成功',
        result: {
          token,
          user: this.buildUserClientPayload(user, sales, { isAdmin }),
        },
      };
    }
    catch (e: any) {
      const msg = String(e?.message ?? e);
      const hint =
        msg.includes("doesn't exist") || msg.includes('ER_NO_SUCH_TABLE')
          ? '数据库缺少 users 表：请在 MySQL 库中执行项目内 api/sql/create_users_table.sql'
          : '';
      return {
        code: 500,
        message: hint || `登录失败: ${msg}`,
      };
    }
  }

  /**
   * 微信手机号快速验证登录：前端通过组件拿到 code，后端调用微信接口换取手机号并完成登录/注册
   */
  @Post('auth/wechat-phone-login')
  async wechatPhoneLogin(@Body() body: any) {
    const rawCode = String(body?.code ?? '').trim();
    if (!rawCode) {
      return {
        code: 400,
        message: '缺少微信手机号授权 code',
      };
    }

    try {
      const phone = await this.wechatService.getPhoneNumberByCode(rawCode);
      let user = await this.usersService.createIfNotExists(phone);
      user = (await this.usersService.findById(user.id)) ?? user;
      let sales = await this.salesService.findByPhone(user.phone);
      if (!sales)
        sales = await this.salesService.findByLinkedUserId(user.id);
      const token = `mock-token-${user.id}`;
      const isAdmin = sales ? !!sales.isAdmin : user.isAdmin;
      return {
        code: 200,
        message: '登录成功',
        result: {
          token,
          user: this.buildUserClientPayload(user, sales, { isAdmin }),
        },
      };
    }
    catch (e: any) {
      const msg = String(e?.message || e || '');
      return {
        code: 500,
        message: msg.includes('微信手机号获取失败')
          ? msg
          : `微信手机号快捷登录失败: ${msg}`,
      };
    }
  }

  @Get('users/:id')
  async getUser(@Param('id') id: string) {
    const user = await this.usersService.findById(Number(id));
    if (!user) {
      return {
        code: 404,
        message: 'User not found',
        result: null,
      };
    }

    // 从销售表同步管理员身份（以 FastAdmin 的 fa_sales.is_admin 为准）；JOIN users 兜底避免 phone 未命中
    let sales = await this.salesService.findByPhone(user.phone);
    if (!sales)
      sales = await this.salesService.findByLinkedUserId(user.id);
    const isAdmin = sales ? !!sales.isAdmin : user.isAdmin;

    // 计算公司名称（如果有 companyId）
    let companyName: string | null = null;
    if (user.companyId) {
      const company = await this.companiesService.findOne(user.companyId);
      companyName = company ? company.name : null;
    }

    const payload = this.buildUserClientPayload(user, sales, { isAdmin, companyName });
    const resolvedName = String(payload.name ?? '').trim();
    if (resolvedName) {
      void this.usersService.persistDisplayNameIfEmpty(user.id, resolvedName).catch(() => {});
    }

    return {
      code: 200,
      message: 'OK',
      result: payload,
    };
  }

  /**
   * 显式构造 JSON，避免展开 TypeORM 实体时 Nest 序列化丢字段（此前会导致 name 一直为空）。
   * 姓名：users.name 优先，否则 fa_sales.name。
   */
  private buildUserClientPayload(
    user: User,
    sales: Sales | null,
    extras: { isAdmin: boolean; companyName?: string | null },
  ) {
    const fromUser = user.name != null ? String(user.name).trim() : '';
    const fromSales = sales?.name != null ? String(sales.name).trim() : '';
    const name = fromUser || fromSales;
    const payload: Record<string, unknown> = {
      id: user.id,
      phone: user.phone != null ? String(user.phone).trim() : '',
      name,
      role: user.role,
      isAdmin: extras.isAdmin,
      companyId: user.companyId,
      points: user.points,
    };
    if (extras.companyName !== undefined)
      payload.companyName = extras.companyName;
    return payload;
  }

  /**
   * 更新用户当前所属公司（销售人员选择公司后调用）
   */
  @Put('users/:id/company')
  async updateCompany(@Param('id') id: string, @Body() body: any) {
    const dto = plainToInstance(UpdateCompanyDto, body);
    await validateOrReject(dto);
    const user = await this.usersService.updateCompany(Number(id), dto.companyId, dto.name);
    return {
      code: 200,
      message: '公司已更新',
      result: user,
    };
  }
}

