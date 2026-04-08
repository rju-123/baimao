import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { User } from './user.entity';
import { Sales } from '../sales/sales.entity';
import { SalesService } from '../sales/sales.service';

@Injectable()
export class UsersService {
  constructor(
    @InjectRepository(User, 'mysql')
    private readonly usersRepo: Repository<User>,
    private readonly salesService: SalesService,
  ) {}

  /**
   * 用户表姓名为空时，用 FastAdmin 销售表（fa_sales.name）按手机号回填并持久化，
   * 与后台管理展示的销售姓名一致。
   */
  private async syncNameFromSalesIfEmpty(user: User, sales: Sales | null | undefined): Promise<void> {
    if (!sales?.name || !String(sales.name).trim())
      return;
    const fromSales = String(sales.name).trim();
    const fromUser = user.name != null ? String(user.name).trim() : '';
    if (fromUser)
      return;
    user.name = fromSales;
    await this.usersRepo.save(user);
  }

  async findById(id: number) {
    const user = await this.usersRepo.findOne({ where: { id } });
    if (!user)
      return null;
    // 同步管理员身份：以 FastAdmin 销售表为准；公司归属以用户表为“当前公司”为准
    let sales = await this.salesService.findByPhone(user.phone);
    if (!sales)
      sales = await this.salesService.findByLinkedUserId(id);
    if (sales) {
      user.isAdmin = !!sales.isAdmin;
      // 用户表无公司时，以销售表为准，确保能查看后台分配的优惠券
      if (user.companyId == null || user.companyId === 0) {
        user.companyId = sales.companyId ?? null;
      }
      await this.syncNameFromSalesIfEmpty(user, sales);
    }
    return user;
  }

  findByPhone(phone: string): Promise<User | null> {
    const p = String(phone ?? '').trim();
    if (!p)
      return Promise.resolve(null);
    return this.usersRepo
      .createQueryBuilder('u')
      .where('TRIM(u.phone) = :p', { p })
      .getOne();
  }

  async createIfNotExists(phone: string): Promise<User> {
    const phoneNorm = String(phone ?? '').trim();
    // 登录场景下，优先以销售表（FastAdmin）的公司与管理员信息为准，避免覆盖后台调整
    let sales = await this.salesService.findByPhone(phoneNorm);

    let user = await this.findByPhone(phoneNorm);
    if (!user) {
      const salesName = sales?.name && String(sales.name).trim() ? String(sales.name).trim() : '';
      user = this.usersRepo.create({
        phone: phoneNorm,
        role: 'sales',
        name: salesName,
        // 新建用户时：如果销售记录已存在，则同步其公司与管理员身份
        isAdmin: sales ? !!sales.isAdmin : false,
        companyId: sales ? sales.companyId ?? null : null,
        points: 0,
      });
      await this.usersRepo.save(user);
    }
    else {
      if (!sales)
        sales = await this.salesService.findByLinkedUserId(user.id);
      if (sales) {
        // 用户已存在：仅同步管理员身份，保留用户当前 companyId（由前端选择公司或后台逻辑维护）
        user.isAdmin = !!sales.isAdmin;
        await this.syncNameFromSalesIfEmpty(user, sales);
        await this.usersRepo.save(user);
      }
    }

    // 登录流程中不再反向覆盖 FastAdmin 的销售表，只读不写。
    // 管理员在后台调整公司 / 管理员身份后，将通过上面的逻辑同步到用户表与返回结果。

    return user;
  }

  async addPoints(userId: number, delta: number) {
    const user = await this.findById(userId);
    if (!user)
      return null;
    user.points += delta;
    await this.usersRepo.save(user);
    return user;
  }

  /** 用户表姓名为空时写入展示名（来自 fa_sales 合并结果），便于后续接口直接读到 name */
  async persistDisplayNameIfEmpty(userId: number, displayName: string): Promise<void> {
    const d = String(displayName ?? '').trim();
    if (!d)
      return;
    const user = await this.usersRepo.findOne({ where: { id: userId } });
    if (!user)
      return;
    if (user.name && String(user.name).trim())
      return;
    user.name = d;
    await this.usersRepo.save(user);
  }

  async updateCompany(userId: number, companyId: number, name?: string) {
    const user = await this.findById(userId);
    if (!user)
      return null;
    user.companyId = companyId;
    if (name && name.trim())
      user.name = name.trim();
    const saved = await this.usersRepo.save(user);
    // 默认将当前用户设为该公司的管理员
    await this.salesService.upsertByPhone(user.phone, name ?? user.name, companyId, true);
    return saved;
  }
}

