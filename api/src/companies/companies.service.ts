import { Injectable, OnModuleInit } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Company } from './company.entity';
import { CreateCompanyDto } from './dto/create-company.dto';

@Injectable()
export class CompaniesService implements OnModuleInit {
  constructor(
    @InjectRepository(Company)
    private readonly companiesRepo: Repository<Company>,
  ) {}

  async onModuleInit() {
    const count = await this.companiesRepo.count();
    if (count === 0) {
      const seed = this.companiesRepo.create([
        {
          name: '某安全公司',
          creditCode: '91110000XXXX000001',
          address: '北京市朝阳区建国路88号',
          contactName: '李经理',
          contactPhone: '010-12345678',
        },
        {
          name: '某科技公司',
          creditCode: '91310000XXXX000002',
          address: '上海市浦东新区世纪大道100号',
          contactName: '王经理',
          contactPhone: '021-87654321',
        },
        {
          name: '某网络公司',
          creditCode: '91440000XXXX000003',
          address: '深圳市南山区科技园一路66号',
          contactName: '张经理',
          contactPhone: '0755-12344321',
        },
      ]);
      await this.companiesRepo.save(seed);
    }
  }

  findAll() {
    return this.companiesRepo.find();
  }

  create(dto: CreateCompanyDto) {
    const entity = this.companiesRepo.create(dto);
    return this.companiesRepo.save(entity);
  }
}

