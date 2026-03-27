import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { User } from './user.entity';
import { SalesService } from '../sales/sales.service';

@Injectable()
export class UsersService {
  constructor(
    @InjectRepository(User)
    private readonly usersRepo: Repository<User>,
    private readonly salesService: SalesService,
  ) {}

  async findById(id: number) {
    const user = await this.usersRepo.findOne({ where: { id } });
    if (!user)
      return null;
    // 同步管理员身份：以 FastAdmin 销售表为准；公司归属以用户表为“当前公司”为准
    const sales = await this.salesService.findByPhone(user.phone);
    if (sales) {
      user.isAdmin = !!sales.isAdmin;
      // 用户表无公司时，以销售表为准，确保能查看后台分配的优惠券
      if (user.companyId == null || user.companyId === 0) {
        user.companyId = sales.companyId ?? null;
      }
    }
    return user;
  }

  findByPhone(phone: string) {
    return this.usersRepo.findOne({ where: { phone } });
  }

  async createIfNotExists(phone: string): Promise<User> {
    // 登录场景下，优先以销售表（FastAdmin）的公司与管理员信息为准，避免覆盖后台调整
    const sales = await this.salesService.findByPhone(phone);

    let user = await this.findByPhone(phone);
    if (!user) {
      user = this.usersRepo.create({
        phone,
        role: 'sales',
        // 新建用户时：如果销售记录已存在，则同步其公司与管理员身份
        isAdmin: sales ? !!sales.isAdmin : false,
        companyId: sales ? sales.companyId ?? null : null,
        points: 0,
      });
      await this.usersRepo.save(user);
    }
    else if (sales) {
      // 用户已存在：仅同步管理员身份，保留用户当前 companyId（由前端选择公司或后台逻辑维护）
      user.isAdmin = !!sales.isAdmin;
      await this.usersRepo.save(user);
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

