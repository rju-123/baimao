import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Sales } from './sales.entity';

@Injectable()
export class SalesService {
  constructor(
    @InjectRepository(Sales, 'mysql')
    private readonly salesRepo: Repository<Sales>,
  ) {}

  /**
   * 按手机号新增或更新销售人员（小程序登录/选公司时同步到后台）
   */
  async upsertByPhone(
    phone: string,
    name?: string,
    companyId?: number | null,
  ): Promise<Sales> {
    const now = Math.floor(Date.now() / 1000);
    let row = await this.salesRepo.findOne({ where: { phone } });
    if (row) {
      if (name !== undefined) row.name = name;
      if (companyId !== undefined) row.companyId = companyId ?? null;
      row.updatetime = now;
      return this.salesRepo.save(row);
    }
    row = this.salesRepo.create({
      phone,
      name: name ?? '',
      companyId: companyId ?? null,
      createtime: now,
      updatetime: now,
    });
    return this.salesRepo.save(row);
  }
}
