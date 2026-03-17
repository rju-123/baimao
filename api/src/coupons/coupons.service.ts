import { Injectable, OnModuleInit } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { LessThan } from 'typeorm';
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
          lockedByUserId: null,
          lockedForProductId: null,
          lockedAt: null,
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
          lockedByUserId: null,
          lockedForProductId: null,
          lockedAt: null,
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
    coupon.lockedByUserId = null;
    coupon.lockedForProductId = null;
    coupon.lockedAt = null;
    return this.couponsRepo.save(coupon);
  }

  async lockCoupon(id: number, userId: number, productId?: number | null) {
    const coupon = await this.couponsRepo.findOne({ where: { id } });
    if (!coupon)
      throw new Error('优惠券不存在');
    await this.expireOverdue();
    // 仅允许锁定可用券；如果已被同一用户锁定也认为成功（幂等）
    if (coupon.status === 'locked') {
      if (coupon.lockedByUserId === userId)
        return coupon;
      throw new Error('优惠券已被占用');
    }
    if (coupon.status !== 'available')
      throw new Error('优惠券不可用');
    coupon.status = 'locked';
    coupon.lockedByUserId = userId;
    coupon.lockedForProductId = productId ?? null;
    coupon.lockedAt = new Date();
    return this.couponsRepo.save(coupon);
  }

  async unlockCoupon(id: number, userId: number) {
    const coupon = await this.couponsRepo.findOne({ where: { id } });
    if (!coupon)
      return null;
    if (coupon.status !== 'locked')
      return coupon;
    // 只允许锁定者释放
    if (coupon.lockedByUserId !== userId)
      throw new Error('无权释放该优惠券');
    coupon.status = 'available';
    coupon.lockedByUserId = null;
    coupon.lockedForProductId = null;
    coupon.lockedAt = null;
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
    // 已锁定但过期的优惠券也标记为过期并释放锁定
    await this.couponsRepo.update(
      {
        status: 'locked',
        validTo: LessThan(now),
      },
      {
        status: 'expired',
        lockedByUserId: null,
        lockedForProductId: null,
        lockedAt: null,
      },
    );
  }
}

