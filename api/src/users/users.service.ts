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
    // 同步管理员身份和所属公司：以 FastAdmin 销售表为准
    const sales = await this.salesService.findByPhone(user.phone);
    if (sales) {
      user.isAdmin = !!sales.isAdmin;
      // 如果销售记录中的公司为空，则认为该用户需要重新选择公司
      user.companyId = sales.companyId ?? null;
    }
    return user;
  }

  findByPhone(phone: string) {
    return this.usersRepo.findOne({ where: { phone } });
  }

  async createIfNotExists(phone: string): Promise<User> {
    let user = await this.findByPhone(phone);
    if (!user) {
      user = this.usersRepo.create({
        phone,
        role: 'sales',
        isAdmin: false,
        companyId: null,
        points: 0,
      });
      await this.usersRepo.save(user);
    }
    await this.salesService.upsertByPhone(phone, user.name, user.companyId);
    // 同步管理员身份：从 fa_sales 表中读取 is_admin
    const sales = await this.salesService.findByPhone(phone);
    if (sales) {
      user.isAdmin = !!sales.isAdmin;
    }
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
    await this.salesService.upsertByPhone(user.phone, name ?? user.name, companyId);
    return saved;
  }
}

