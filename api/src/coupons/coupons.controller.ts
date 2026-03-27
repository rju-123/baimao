import { Body, Controller, Get, Param, Post, Query } from '@nestjs/common';
import { CouponsService } from './coupons.service';

@Controller('coupons')
export class CouponsController {
  constructor(private readonly couponsService: CouponsService) {}

  /** 调试接口：返回查询参数与优惠券数量，便于排查 */
  @Get('debug')
  async debug(@Query('userId') userId: string) {
    const uid = Number(userId);
    if (!userId || Number.isNaN(uid) || uid <= 0) {
      return { code: 400, message: '缺少有效的 userId', result: null };
    }
    const info = await this.couponsService.getDebugInfo(uid);
    return { code: 200, message: 'OK', result: info };
  }

  @Get()
  async list(
    @Query('userId') userId: string,
    @Query('status') status?: string,
  ) {
    const uid = Number(userId);
    if (!userId || Number.isNaN(uid) || uid <= 0) {
      return {
        code: 400,
        message: '缺少有效的 userId',
        result: [],
      };
    }
    await this.couponsService.expireOverdue();
    const data = await this.couponsService.findByUser(uid, status);
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

  /**
   * 加入购物车时锁定优惠券（占用）
   */
  @Post(':id/lock')
  async lock(@Param('id') id: string, @Body() body: any) {
    const userId = Number(body?.userId || body?.data?.userId || 0);
    const productId = body?.productId ?? body?.data?.productId ?? null;
    if (!userId) {
      return {
        code: 400,
        message: '缺少 userId',
        result: null,
      };
    }
    const coupon = await this.couponsService.lockCoupon(Number(id), userId, productId);
    return {
      code: 200,
      message: '优惠券已锁定',
      result: coupon,
    };
  }

  /**
   * 从购物车移除商品/清空购物车时释放优惠券
   */
  @Post(':id/unlock')
  async unlock(@Param('id') id: string, @Body() body: any) {
    const userId = Number(body?.userId || body?.data?.userId || 0);
    if (!userId) {
      return {
        code: 400,
        message: '缺少 userId',
        result: null,
      };
    }
    const coupon = await this.couponsService.unlockCoupon(Number(id), userId);
    return {
      code: 200,
      message: '优惠券已释放',
      result: coupon,
    };
  }
}

