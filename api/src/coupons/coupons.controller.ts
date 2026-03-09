import { Controller, Get, Param, Post, Query } from '@nestjs/common';
import { CouponsService } from './coupons.service';

@Controller('coupons')
export class CouponsController {
  constructor(private readonly couponsService: CouponsService) {}

  @Get()
  async list(
    @Query('userId') userId: string,
    @Query('status') status?: string,
  ) {
    await this.couponsService.expireOverdue();
    const data = await this.couponsService.findByUser(Number(userId), status);
    return {
      code: 200,
      message: 'OK',
      result: data,
    };
  }

  @Post(':id/use')
  async use(@Param('id') id: string) {
    const coupon = await this.couponsService.markUsed(Number(id));
    return {
      code: 200,
      message: '优惠券已使用',
      result: coupon,
    };
  }
}

