import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { In, Repository } from 'typeorm';
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
    @InjectRepository(User, 'mysql')
    private readonly usersRepo: Repository<User>,
  ) {}

  findAll() {
    return this.companiesRepo.find({
      where: { status: 'approved' as any },
    });
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
    // 1. 先基于订单表统计：所有在该公司下产生过订单的销售手机号及其订单数
    const rawCounts = await this.ordersRepo.createQueryBuilder('o')
      .select('o.sales_phone', 'phone')
      .addSelect('COUNT(*)', 'totalOrders')
      .where('o.company_id = :companyId', { companyId })
      .groupBy('o.sales_phone')
      .getRawMany();

    if (rawCounts.length === 0)
      return [];

    const phones = rawCounts.map((r: any) => r.phone as string);
    const countMap = new Map<string, number>();
    rawCounts.forEach((r: any) => {
      countMap.set(r.phone, Number(r.totalOrders) || 0);
    });

    // 2. 拉取这些手机号在销售表中的所有记录（可能在不同公司）
    const salesRows = await this.salesRepo.find({
      where: { phone: In(phones) },
    });
    const salesByPhone = new Map<string, Sales[]>();
    salesRows.forEach(row => {
      const list = salesByPhone.get(row.phone) ?? [];
      list.push(row);
      salesByPhone.set(row.phone, list);
    });

    // 3. 读取用户表中这些手机号当前所属公司，用于判断是否为“已移除”成员
    const users = await this.usersRepo.find({
      where: { phone: In(phones) },
    });
    const userCompanyMap = new Map<string, number | null>();
    users.forEach((u: User) => {
      userCompanyMap.set(u.phone, u.companyId ?? null);
    });

    // 4. 组装成员列表：
    // - 如果在销售表中存在当前 companyId 下的记录 => 视为在职成员
    // - 否则，从其它公司记录或仅订单记录中构造一条历史成员，标记为 removed=true
    const members = phones.map((phone) => {
      const salesList = salesByPhone.get(phone) ?? [];
      const activeRow = salesList.find(row => row.companyId === companyId) ?? null;
      const anyRow = activeRow ?? salesList[0] ?? null;

      const currentCompanyId = userCompanyMap.get(phone) ?? null;
      const removed = currentCompanyId !== companyId;
      const totalOrders = countMap.get(phone) ?? 0;

      return {
        id: anyRow ? anyRow.id : 0,
        name: anyRow ? anyRow.name : '',
        phone,
        isAdmin: activeRow ? !!activeRow.isAdmin : false,
        createtime: anyRow ? anyRow.createtime : null,
        totalOrders,
        removed,
      };
    });

    return members;
  }

  /**
   * 将某个销售从公司中移除：
   * - 在销售表中保留 companyId，仅清空管理员标记，用于“我的公司”历史展示
   * - 在用户表中清空当前 companyId，强制其在小程序中重新选择公司
   */
  async removeMember(companyId: number, salesId: number) {
    // 先按 id + companyId 精确找到记录
    const row = await this.salesRepo.findOne({ where: { id: salesId, companyId } });
    if (!row)
      return false;
    const now = Math.floor(Date.now() / 1000);
    const phone = row.phone;

    // 在销售表中仅清空管理员标记，保留 companyId 以便“我的公司”展示历史成员
    await this.salesRepo.update({ phone, companyId }, {
      isAdmin: 0,
      updatetime: now,
    });

    // 同步清空 users 表中对应用户的当前 companyId，强制其重新选择公司
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

