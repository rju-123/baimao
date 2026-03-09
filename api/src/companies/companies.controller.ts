import { Body, Controller, Get, Post } from '@nestjs/common';
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
    const dto = plainToInstance(CreateCompanyDto, body);
    await validateOrReject(dto);
    const company = await this.companiesService.create(dto);
    return {
      code: 200,
      message: '公司创建成功',
      result: company,
    };
  }
}

