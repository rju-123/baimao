import { Injectable, OnModuleInit } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Between, LessThan } from 'typeorm';
import { Coupon } from './coupon.entity';
import { Repository } from 'typeorm';

@Injectable()
export class CouponsService implements OnModuleInit {
  constructor(
    @InjectRepository(Coupon)
    private readonly couponsRepo: Repository<Coupon>,
  ) {}

  async onModuleInit() {
    const count = await this.couponsRepo.count();
    if (count === 0) {
      const now = new Date();
      const end = new Date(now.getTime() + 15 * 24 * 60 * 60 * 1000);
      const seed: Partial<Coupon>[] = [
        {
          userId: 1,
          name: '满1000减100券',
          type: 'amount',
          value: 100,
          minAmount: 1000,
          validFrom: now,
          validTo: end,
          status: 'available',
        },
        {
          userId: 1,
          name: '全场9折券',
          type: 'discount',
          value: 0.9,
          minAmount: 0,
          validFrom: now,
          validTo: end,
          status: 'available',
        },
      ];
      await this.couponsRepo.save(this.couponsRepo.create(seed));
    }
  }

  findByUser(userId: number, status?: string) {
    const where: any = { userId };
    if (status)
      where.status = status;
    return this.couponsRepo.find({ where, order: { validTo: 'ASC' } });
  }

  async markUsed(id: number) {
    const coupon = await this.couponsRepo.findOne({ where: { id } });
    if (!coupon)
      return null;
    coupon.status = 'used';
    return this.couponsRepo.save(coupon);
  }

  async expireOverdue() {
    const now = new Date();
    await this.couponsRepo.update(
      {
        status: 'available',
        validTo: LessThan(now),
      },
      { status: 'expired' },
    );
  }
}

