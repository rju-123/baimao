import { get, post } from '@/utils/request';

export interface Coupon {
  id: number;
  userId?: number | null; // 公司共享优惠券为 null
  name: string;
  type: string;
  value: number;
  minAmount: number;
  validFrom: string;
  validTo: string;
  status: string;
}

/**
 * 获取用户优惠券列表，不传 status 则返回全部
 * 统一使用此接口，确保选择优惠券弹窗与全部优惠券页面数据一致
 */
export async function listCoupons(userId: number, status?: 'available' | 'used' | 'expired'): Promise<Coupon[]> {
  const params = new URLSearchParams();
  params.set('userId', String(userId));
  if (status)
    params.set('status', status);
  const data = await get<Coupon[]>(`/coupons?${params.toString()}`);
  return Array.isArray(data) ? data : [];
}

/** 锁定优惠券（加入购物车时） */
export function lockCoupon(id: number, userId: number, productId?: number | null) {
  return post(`/coupons/${id}/lock`, {
    data: { userId, productId: productId ?? null },
  });
}

/** 释放优惠券（移除商品/清空购物车时） */
export function unlockCoupon(id: number, userId: number) {
  return post(`/coupons/${id}/unlock`, {
    data: { userId },
  });
}

/** 标记优惠券已使用（下单成功后） */
export function useCoupon(id: number) {
  return post(`/coupons/${id}/use`);
}
