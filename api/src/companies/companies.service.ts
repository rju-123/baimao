import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Company } from './company.entity';
import { Sales } from '../sales/sales.entity';
import { Order } from '../orders/order.entity';
import { User } from '../users/user.entity';
import { CreateCompanyDto } from './dto/create-company.dto';

@Injectable()
export class CompaniesService {
  constructor(
    @InjectRepository(Company, 'mysql')
    private readonly companiesRepo: Repository<Company>,
    @InjectRepository(Sales, 'mysql')
    private readonly salesRepo: Repository<Sales>,
    @InjectRepository(Order, 'mysql')
    private readonly ordersRepo: Repository<Order>,
    @InjectRepository(User)
    private readonly usersRepo: Repository<User>,
  ) {}

  findAll() {
    return this.companiesRepo.find();
  }

  findOne(id: number) {
    return this.companiesRepo.findOne({ where: { id } });
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

  async getDashboard(companyId: number) {
    const company = await this.companiesRepo.findOne({ where: { id: companyId } });
    if (!company)
      return null;

    const [teamCount, totalOrders] = await Promise.all([
      this.salesRepo.count({ where: { companyId } }),
      this.ordersRepo.count({ where: { companyId } }),
    ]);

    // 公司优惠券目前尚未接入，先返回 0 占位
    const couponCount = 0;

    return {
      id: company.id,
      name: company.name,
      teamCount,
      totalOrders,
      couponCount,
    };
  }

  async getMembers(companyId: number) {
    const rows = await this.salesRepo.find({ where: { companyId } });
    if (rows.length === 0)
      return [];

    const phones = rows.map(row => row.phone);
    const rawCounts = await this.ordersRepo.createQueryBuilder('o')
      // 注意：这里直接使用底层列名 sales_phone，避免 ONLY_FULL_GROUP_BY 问题
      .select('o.sales_phone', 'phone')
      .addSelect('COUNT(*)', 'totalOrders')
      .where('o.sales_phone IN (:...phones)', { phones })
      .groupBy('o.sales_phone')
      .getRawMany();

    const countMap = new Map<string, number>();
    rawCounts.forEach((r: any) => {
      countMap.set(r.phone, Number(r.totalOrders) || 0);
    });

    return rows.map(row => ({
      id: row.id,
      name: row.name,
      phone: row.phone,
      isAdmin: !!(row as any).isAdmin,
      createtime: row.createtime,
      totalOrders: countMap.get(row.phone) ?? 0,
    }));
  }

  /**
   * 将某个销售从公司中移除：清空其 companyId 与管理员标记
   */
  async removeMember(companyId: number, salesId: number) {
    // 先按 id + companyId 精确找到记录
    const row = await this.salesRepo.findOne({ where: { id: salesId, companyId } });
    if (!row)
      return false;
    const now = Math.floor(Date.now() / 1000);
    const phone = row.phone;

    // 以手机号为准，清空该手机号下所有销售记录的公司与管理员标记，保证一致性
    await this.salesRepo.update({ phone }, {
      companyId: null,
      isAdmin: 0,
      updatetime: now,
    });

    // 同步清空 users 表中对应用户的 companyId
    if (phone) {
      const user = await this.usersRepo.findOne({ where: { phone } });
      if (user) {
        user.companyId = null;
        await this.usersRepo.save(user);
      }
    }
    return true;
  }

  /**
   * 转交管理员：将当前公司下所有成员设为普通成员，再将目标成员设为管理员
   */
  async transferAdmin(companyId: number, targetSalesId: number) {
    const target = await this.salesRepo.findOne({ where: { id: targetSalesId, companyId } });
    if (!target)
      return false;

    const now = Math.floor(Date.now() / 1000);

    // 所有成员先清零管理员标记
    await this.salesRepo.update({ companyId }, { isAdmin: 0, updatetime: now });

    // 目标成员设为管理员
    target.isAdmin = 1;
    target.updatetime = now;
    await this.salesRepo.save(target);
    return true;
  }
}

