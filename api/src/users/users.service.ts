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

  findById(id: number) {
    return this.usersRepo.findOne({ where: { id } });
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

  async updateCompany(userId: number, companyId: number) {
    const user = await this.findById(userId);
    if (!user)
      return null;
    user.companyId = companyId;
    const saved = await this.usersRepo.save(user);
    await this.salesService.upsertByPhone(user.phone, undefined, companyId);
    return saved;
  }
}

