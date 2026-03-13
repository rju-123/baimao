import { Body, Controller, Get, Param, Post, Put } from '@nestjs/common';
import { plainToInstance } from 'class-transformer';
import { validateOrReject } from 'class-validator';
import { UsersService } from './users.service';
import { LoginDto } from './dto/login.dto';
import { UpdateCompanyDto } from './dto/update-company.dto';
import { SendCodeDto } from './dto/send-code.dto';
import { SalesService } from '../sales/sales.service';
import { CompaniesService } from '../companies/companies.service';

@Controller()
export class UsersController {
  constructor(
    private readonly usersService: UsersService,
    private readonly salesService: SalesService,
    private readonly companiesService: CompaniesService,
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
    const dto = plainToInstance(LoginDto, body);
    await validateOrReject(dto);

    if (dto.code !== '1234') {
      return {
        code: 400,
        message: '验证码错误，当前仅支持测试验证码 1234',
      };
    }

    const user = await this.usersService.createIfNotExists(dto.phone);
    const token = `mock-token-${user.id}`;

    return {
      code: 200,
      message: '登录成功',
      result: {
        token,
        user,
      },
    };
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

    // 从销售表同步管理员身份（以 FastAdmin 的 fa_sales.is_admin 为准）
    const sales = await this.salesService.findByPhone(user.phone);
    const isAdmin = sales ? !!sales.isAdmin : user.isAdmin;

    // 计算公司名称（如果有 companyId）
    let companyName: string | null = null;
    if (user.companyId) {
      const company = await this.companiesService.findOne(user.companyId);
      companyName = company ? company.name : null;
    }

    return {
      code: 200,
      message: 'OK',
      result: {
        ...user,
        isAdmin,
        companyName,
      },
    };
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

