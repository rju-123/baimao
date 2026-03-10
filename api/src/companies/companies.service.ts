import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Company } from './company.entity';
import { CreateCompanyDto } from './dto/create-company.dto';

@Injectable()
export class CompaniesService {
  constructor(
    @InjectRepository(Company, 'mysql')
    private readonly companiesRepo: Repository<Company>,
  ) {}

  findAll() {
    return this.companiesRepo.find();
  }

  async create(dto: CreateCompanyDto) {
    const now = Math.floor(Date.now() / 1000);
    const entity = this.companiesRepo.create({
      ...dto,
      createtime: now,
      updatetime: now,
    });
    return this.companiesRepo.save(entity);
  }
}

