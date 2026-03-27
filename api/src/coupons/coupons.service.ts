import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { LessThan } from 'typeorm';
import { Coupon } from './coupon.entity';
import { Repository } from 'typeorm';
import { UsersService } from '../users/users.service';
import { SalesService } from '../sales/sales.service';

@Injectable()
export class CouponsService {
  constructor(
    @InjectRepository(Coupon, 'mysql')
    private readonly couponsRepo: Repository<Coupon>,
    private readonly usersService: UsersService,
    private readonly salesService: SalesService,
  ) {}

  /** 调试用：返回查询参数与优惠券数量 */
  async getDebugInfo(userId: number) {
    const user = await this.usersService.findById(userId);
    if (!user)
      return { user: null, companyIds: [], couponCount: 0 };
    const companyIds: number[] = [];
    if (user.companyId)
      companyIds.push(user.companyId);
    let salesCompanyId: number | null = null;
    if (user.phone) {
      const sales = await this.salesService.findByPhone(user.phone);
      if (sales?.companyId) {
        salesCompanyId = sales.companyId;
        if (!companyIds.includes(sales.companyId))
          companyIds.push(sales.companyId);
      }
    }
    let couponCount = 0;
    if (companyIds.length > 0) {
      couponCount = await this.couponsRepo
        .createQueryBuilder('c')
        .where('c.companyId IN (:...companyIds)', { companyIds })
        .andWhere('(c.userId IS NULL OR c.userId = :userId)', { userId })
        .getCount();
    }
    return {
      userId,
      userCompanyId: user.companyId,
      salesCompanyId,
      companyIds,
      couponCount,
    };
  }

  async findByUser(userId: number, status?: string) {
    const user = await this.usersService.findById(userId);
    if (!user)
      return [];
    // 合并用户表与销售表的 companyId，确保能查到后台分配的优惠券
    const companyIds: number[] = [];
    if (user.companyId)
      companyIds.push(user.companyId);
    if (user.phone) {
      const sales = await this.salesService.findByPhone(user.phone);
      if (sales?.companyId && !companyIds.includes(sales.companyId))
        companyIds.push(sales.companyId);
    }
    if (companyIds.length === 0)
      return [];
    await this.expireOverdue();
    const qb = this.couponsRepo.createQueryBuilder('c')
      .where('c.companyId IN (:...companyIds)', { companyIds })
      .andWhere('(c.userId IS NULL OR c.userId = :userId)', { userId });
    if (status)
      qb.andWhere('c.status = :status', { status });
    qb.orderBy('c.validTo', 'ASC');
    return qb.getMany();
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
    const user = await this.usersService.findById(userId);
    if (!user)
      throw new Error('用户不存在');
    const companyIds: number[] = [];
    if (user.companyId)
      companyIds.push(user.companyId);
    if (user.phone) {
      const sales = await this.salesService.findByPhone(user.phone);
      if (sales?.companyId && !companyIds.includes(sales.companyId))
        companyIds.push(sales.companyId);
    }
    if (companyIds.length === 0)
      throw new Error('用户未关联公司');
    const coupon = await this.couponsRepo.findOne({ where: { id } });
    if (!coupon)
      throw new Error('优惠券不存在');
    if (!companyIds.includes(coupon.companyId))
      throw new Error('无权使用该优惠券');
    if (coupon.userId != null && coupon.userId !== userId)
      throw new Error('该优惠券已分配给其他用户');
    await this.expireOverdue();
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

