<template>
  <view class="page">
    <view class="header">
      <view class="header-left">
        <view class="title">确认购买</view>
        <view class="sub">共 {{ items.length }} 件商品</view>
      </view>
      <view class="header-right">
        <view class="sum-label">合计</view>
        <view class="sum-value">￥{{ formatAmount(totalPay) }}</view>
      </view>
    </view>

    <view v-if="items.length" class="list">
      <view
        v-for="(item, index) in items"
        :key="`${item.productId}-${index}`"
        class="card product"
      >
        <view class="product-head">
          <view class="head-left">
            <view class="badge">商品 {{ index + 1 }}</view>
            <view class="name">{{ item.productName || `产品 #${item.productId}` }}</view>
          </view>
        </view>

        <view class="product-body">
          <view class="line">
            <text class="k">单价</text>
            <text class="v">￥{{ formatAmount(item.unitPrice) }}</text>
          </view>
          <view class="line">
            <text class="k">数量</text>
            <text class="v">{{ item.quantity }} 件</text>
          </view>
          <view class="line">
            <text class="k">产品总额</text>
            <text class="v">￥{{ formatAmount(calcItemAmount(item)) }}</text>
          </view>
          <view class="line coupon-line" @tap.stop="openCouponPopup(index)">
            <text class="k">优惠券</text>
            <view class="coupon-value-wrap">
              <text v-if="item.couponId" class="v coupon">{{ item.couponName || `#${item.couponId}` }} -￥{{ formatAmount(calcItemDiscount(item)) }}</text>
              <text v-else class="coupon-select">选择优惠券</text>
              <text class="coupon-arrow">›</text>
            </view>
          </view>
          <view class="line pay">
            <text class="k">实付金额</text>
            <text class="v pay">￥{{ formatAmount(calcItemPay(item)) }}</text>
          </view>
        </view>
      </view>
    </view>

    <nut-popup v-model:visible="couponVisible" position="bottom" round>
      <view class="coupon-sheet">
        <view class="coupon-sheet-header">
          <text class="coupon-sheet-title">选择优惠券</text>
          <text class="coupon-sheet-all" @tap="goAllCoupons">全部优惠券</text>
        </view>
        <scroll-view scroll-y class="coupon-list">
          <view v-if="!coupons.length" class="coupon-empty">暂无可用优惠券</view>
          <view
            v-for="c in coupons"
            :key="c.id"
            class="coupon-item"
            :class="{ disabled: !isCouponUsable(c) }"
            @tap="selectCoupon(c)"
          >
            <view class="coupon-main">
              <view class="coupon-amount">
                {{ c.type === 'discount' ? `${Math.round(c.value * 10)}折` : `￥${Math.round(c.value)}` }}
              </view>
              <view class="coupon-info">
                <view class="coupon-name">{{ c.name }}</view>
                <view class="coupon-limit">{{ c.minAmount > 0 ? `满¥${Math.round(c.minAmount)}可用` : '无门槛' }}</view>
              </view>
            </view>
          </view>
        </scroll-view>
        <button class="coupon-confirm" @tap="closeCouponPopup">完成</button>
      </view>
    </nut-popup>

    <view v-if="!items.length" class="card empty">
      <view class="empty-title">购物车为空</view>
      <view class="empty-sub">请先添加商品到购物车</view>
      <button class="go-btn" @tap="goCart">返回购物车</button>
    </view>

    <view class="bottom-bar">
      <view class="bottom-row">
        <view class="bottom-total">
          <text class="bottom-label">合计</text>
          <text class="bottom-value">￥{{ formatAmount(totalPay) }}</text>
        </view>
      </view>
      <button class="submit-btn" :disabled="submitting || !items.length" @tap="submit">
        {{ submitting ? '提交中...' : '确认下单' }}
      </button>
    </view>
  </view>
</template>

<script setup lang="ts">
import { onShow, onUnload } from '@dcloudio/uni-app';
import { get, post } from '@/utils/request';
import { toast } from '@/utils/uni-helpers';
import useUserStore from '@/store/modules/user';
import { CouponApi, ProductApi } from '@/api';
import type { Coupon } from '@/api/coupon';

const CART_STORAGE_KEY = 'sales_cart_items';
const COUPON_SELECTION_RESULT = 'coupon_selection_result';

interface CartItem {
  productId: number;
  productName: string;
  unitPrice: number;
  quantity: number;
  couponId?: number | null;
  couponName?: string;
  couponValue?: number;
  couponType?: string;
  couponMinAmount?: number;
  inventory?: number;
  soldOut?: boolean;
}

const userStore = useUserStore();
const items = ref<CartItem[]>([]);
const submitting = ref(false);
const couponVisible = ref(false);
const editingItemIndex = ref<number | null>(null);
const coupons = ref<Coupon[]>([]);
const submittedSuccess = ref(false);

function loadCart(): CartItem[] {
  try {
    const raw = uni.getStorageSync(CART_STORAGE_KEY);
    const arr = typeof raw === 'string' ? JSON.parse(raw) : raw;
    return Array.isArray(arr) ? arr : [];
  } catch {
    return [];
  }
}

function refresh() {
  items.value = loadCart();
}

async function refreshStocks() {
  const list = loadCart();
  const ids = Array.from(new Set(list.map(i => Number(i.productId || 0)).filter(n => n > 0)));
  if (!ids.length) {
    items.value = list;
    return;
  }
  try {
    const stocks = await ProductApi.getProductStocks(ids);
    const map = new Map<number, ProductApi.ProductStock>();
    for (const s of (stocks || []))
      map.set(Number(s.id), s);
    const next = list.map((it) => {
      const s = map.get(Number(it.productId));
      const inventory = typeof s?.inventory === 'number' ? s.inventory : 0;
      const soldOut = inventory <= 0;
      return { ...it, soldOut, inventory };
    });
    items.value = next;
    uni.setStorageSync(CART_STORAGE_KEY, JSON.stringify(next));
  } catch {
    items.value = list;
  }
  // 若存在售罄或超库存商品，提示并返回购物车，避免继续结算
  const hasSoldOut = items.value.some(i => i.soldOut);
  const hasOverInventory = items.value.some((i) => {
    const inventory = Number(i.inventory ?? 0);
    return inventory > 0 && Number(i.quantity || 0) > inventory;
  });
  if (hasSoldOut || hasOverInventory) {
    toast(hasSoldOut ? '存在已售罄商品，请返回购物车移除后再下单' : '存在超出库存数量的商品，请返回购物车调整后再下单');
    setTimeout(() => {
      uni.navigateBack();
    }, 300);
  }
}

function saveCart(list: CartItem[]) {
  uni.setStorageSync(CART_STORAGE_KEY, JSON.stringify(list || []));
}

async function openCouponPopup(index: number) {
  editingItemIndex.value = index;
  const userId = Number(userStore.user_id || 0);
  if (!userId) {
    toast('请先登录');
    return;
  }
  try {
    await userStore.refreshUserInfo?.();
    const data = await get<Coupon[]>(`/coupons?userId=${encodeURIComponent(String(userId))}&status=available`);
    coupons.value = Array.isArray(data) ? data : [];
  } catch (e) {
    console.warn('load coupons failed', e);
    coupons.value = [];
  }
  couponVisible.value = true;
}

function closeCouponPopup() {
  couponVisible.value = false;
  editingItemIndex.value = null;
}

function editingItemAmount(): number {
  const idx = editingItemIndex.value;
  if (idx == null) return 0;
  const item = items.value[idx];
  return item ? calcItemAmount(item) : 0;
}

function isCouponUsable(c: Coupon): boolean {
  return editingItemAmount() >= (c.minAmount || 0);
}

async function selectCoupon(c: Coupon) {
  if (!isCouponUsable(c)) {
    toast('未满足使用门槛');
    return;
  }
  const idx = editingItemIndex.value;
  if (idx == null) return;
  const list = loadCart();
  const item = list[idx];
  if (!item) return;
  const oldCouponId = item.couponId;
  if (oldCouponId) {
    try {
      await CouponApi.unlockCoupon(oldCouponId, Number(userStore.user_id || 0));
    } catch (e) {
      console.warn('unlock coupon failed', e);
    }
  }
  try {
    await CouponApi.lockCoupon(c.id, Number(userStore.user_id || 0), item.productId);
  } catch (e) {
    toast('优惠券锁定失败，请重试');
    return;
  }
  list[idx] = {
    ...item,
    couponId: c.id,
    couponName: c.name,
    couponValue: c.value,
    couponType: c.type,
    couponMinAmount: c.minAmount || 0,
  };
  saveCart(list);
  items.value = list;
  closeCouponPopup();
}

async function removeCoupon(index: number) {
  const list = loadCart();
  const item = list[index];
  if (!item) return;
  if (item.couponId) {
    try {
      await CouponApi.unlockCoupon(item.couponId, Number(userStore.user_id || 0));
    } catch (e) {
      console.warn('unlock coupon failed', e);
    }
    list[index] = { ...item, couponId: null, couponName: '', couponValue: 0, couponType: '', couponMinAmount: 0 };
    saveCart(list);
    items.value = list;
  }
}

function goAllCoupons() {
  const idx = editingItemIndex.value;
  if (idx == null) return;
  const item = items.value[idx];
  if (!item) return;
  couponVisible.value = false;
  const amt = Math.round(calcItemAmount(item));
  uni.navigateTo({
    url: `/pages/sales/coupons/index?from=cart_confirm&itemIndex=${idx}&productId=${item.productId}&amount=${amt}`,
  });
}

function applyCouponSelectionResult() {
  try {
    const raw = uni.getStorageSync(COUPON_SELECTION_RESULT);
    if (!raw) return;
    const data = JSON.parse(raw);
    if (data.from !== 'cart_confirm' || data.itemIndex == null) return;
    uni.removeStorageSync(COUPON_SELECTION_RESULT);
    const list = loadCart();
    const idx = Number(data.itemIndex);
    const item = list[idx];
    if (!item) return;
    const userId = Number(userStore.user_id || 0);
    if (data.couponId) {
      const oldCouponId = item.couponId;
      if (oldCouponId) {
        CouponApi.unlockCoupon(oldCouponId, userId).catch((e: any) => console.warn('unlock failed', e));
      }
      CouponApi.lockCoupon(data.couponId, userId, item.productId).then(() => {
        list[idx] = {
          ...item,
          couponId: data.couponId,
          couponName: data.couponName || '',
          couponValue: Number(data.couponValue || 0),
          couponType: data.couponType || '',
          couponMinAmount: Number(data.couponMinAmount || 0),
        };
        saveCart(list);
        items.value = list;
      }).catch((e: any) => {
        console.warn('lock coupon failed', e);
        toast('优惠券锁定失败');
      });
    }
    else {
      if (item.couponId) {
        CouponApi.unlockCoupon(item.couponId, userId).catch((e: any) => console.warn('unlock failed', e));
      }
      list[idx] = { ...item, couponId: null, couponName: '', couponValue: 0, couponType: '', couponMinAmount: 0 };
      saveCart(list);
      items.value = list;
    }
  }
  catch (e) {
    console.warn('apply coupon selection failed', e);
  }
}

function formatAmount(val: number | string | null | undefined): string {
  const n = Number(val);
  return Number.isNaN(n) ? '0' : n.toFixed(0);
}

function calcItemAmount(item: CartItem): number {
  const qty = item.quantity > 0 ? item.quantity : 1;
  const price = Number(item.unitPrice || 0);
  return qty * price;
}

function calcItemDiscount(item: CartItem): number {
  const amount = calcItemAmount(item);
  if (!item.couponId) return 0;
  const min = Number(item.couponMinAmount || 0);
  if (amount < min) return 0;
  const type = item.couponType || '';
  const v = Number(item.couponValue || 0);
  if (type === 'discount')
    return Math.max(0, Math.round(amount * (1 - v)));
  return Math.max(0, Math.min(amount, v));
}

function calcItemPay(item: CartItem): number {
  const amount = calcItemAmount(item);
  const discount = calcItemDiscount(item);
  return Math.max(0, amount - discount);
}

const totalPay = computed(() => items.value.reduce((sum, it) => sum + calcItemPay(it), 0));

async function unlockAllCoupons() {
  const list = items.value;
  for (const item of list) {
    if (item?.couponId) {
      try {
        await CouponApi.unlockCoupon(item.couponId, Number(userStore.user_id || 0));
      } catch (e) {
        console.warn('unlock coupon failed', e);
      }
    }
  }
}

function clearCartCoupons() {
  const list = loadCart();
  const cleared = list.map((it) => ({
    ...it,
    couponId: null,
    couponName: '',
    couponValue: 0,
    couponType: '',
    couponMinAmount: 0,
  }));
  saveCart(cleared);
  items.value = cleared;
}

async function goCart() {
  await unlockAllCoupons();
  clearCartCoupons();
  uni.navigateBack();
}

async function submit() {
  const userId = Number(userStore.user_id || 0);
  if (!userId) {
    toast('请先登录');
    return;
  }
  if (!items.value.length) {
    toast('购物车为空');
    return;
  }
  if (submitting.value)
    return;

  submitting.value = true;
  try {
    // 1) 创建签署流程（占位：后端保存购物车快照）
    const flow = await post<{ flowId: string }>('/esign/flows', {
      data: { userId, companyId: userStore.companyId, items: items.value },
    });
    const flowId = (flow as any)?.flowId || '';
    if (!flowId) {
      toast('发起签署失败');
      return;
    }

    // 2) 电子签签署占位：当前直接认为用户完成签署
    const res = await post<{ orderId: number }>('/esign/flows/complete', {
      data: { flowId },
    });
    const orderId = (res as any)?.orderId;

    // 3) 清空购物车并用 reLaunch 进入「我的订单」，清空页面栈，避免返回时回到购物车/确认页
    submittedSuccess.value = true;
    uni.removeStorageSync(CART_STORAGE_KEY);
    try {
      await userStore.refreshUserInfo();
    }
    catch {
      // 忽略刷新失败，积分已在服务端入账
    }
    toast('下单成功', 'success');
    setTimeout(() => {
      uni.reLaunch({ url: '/pages/sales/created/index' });
    }, 400);
  } catch (e: any) {
    console.error('submit order error', e);
    toast(e?.message || '下单失败');
  } finally {
    submitting.value = false;
  }
}

onShow(() => {
  refresh();
  refreshStocks();
  applyCouponSelectionResult();
});

onUnload(() => {
  if (!submittedSuccess.value) {
    unlockAllCoupons();
    clearCartCoupons();
  }
});
</script>

<style scoped lang="scss">
.page {
  min-height: 100vh;
  padding: 32rpx 32rpx 160rpx;
  box-sizing: border-box;
  background: linear-gradient(180deg, var(--theme-bg-gradient-start) 0%, var(--theme-bg-gradient-end) 100%);
}

.header {
  display: flex;
  justify-content: space-between;
  align-items: flex-end;
  margin-bottom: 20rpx;
}

.title {
  font-size: 34rpx;
  font-weight: 700;
  color: var(--theme-text-title);
}

.sub {
  margin-top: 6rpx;
  font-size: 24rpx;
  color: var(--theme-text-subtitle);
}

.sum-label {
  font-size: 22rpx;
  color: var(--theme-text-subtitle);
  text-align: right;
}

.sum-value {
  margin-top: 4rpx;
  font-size: 30rpx;
  font-weight: 700;
  color: #ef4444;
  text-align: right;
}

.list {
  display: flex;
  flex-direction: column;
  gap: 20rpx;
}

.card {
  padding: 28rpx 32rpx;
  border-radius: var(--theme-card-radius);
  background-color: #ffffff;
  box-shadow: var(--theme-card-shadow);
}

.product-head {
  display: flex;
  align-items: center;
  justify-content: space-between;
}

.head-left {
  display: flex;
  align-items: center;
  gap: 12rpx;
  min-width: 0;
}

.badge {
  font-size: 22rpx;
  color: #007AFF;
  background: rgba(0, 122, 255, 0.1);
  padding: 6rpx 10rpx;
  border-radius: 9999rpx;
}

.name {
  font-size: 28rpx;
  font-weight: 700;
  color: var(--theme-text-title);
  overflow: hidden;
  white-space: nowrap;
  text-overflow: ellipsis;
}

.product-body {
  margin-top: 14rpx;
  padding-top: 12rpx;
  border-top: 1rpx solid #f3f4f6;
}

.line {
  display: flex;
  align-items: center;
  justify-content: space-between;
  margin-top: 20rpx;
  font-size: 28rpx;
}

.k {
  color: var(--theme-text-subtitle);
  font-size: 28rpx;
}

.v {
  color: var(--theme-text-title);
  font-weight: 500;
  font-size: 30rpx;
  max-width: 440rpx;
  text-align: right;
  overflow: hidden;
  white-space: nowrap;
  text-overflow: ellipsis;
}

.v.coupon {
  color: #ef4444;
  font-weight: 600;
}

.coupon-line .coupon-value-wrap {
  display: flex;
  align-items: center;
  gap: 8rpx;
  flex: 1;
  justify-content: flex-end;
}

.coupon-arrow {
  font-size: 28rpx;
  color: #c0c4cc;
}

.coupon-select {
  font-size: 28rpx;
  color: #007AFF;
}

.coupon-empty {
  padding: 40rpx;
  text-align: center;
  font-size: 28rpx;
  color: var(--theme-text-subtitle);
}

.line.pay .v.pay {
  color: #ef4444;
  font-weight: 700;
}

.empty-title {
  font-size: 28rpx;
  font-weight: 700;
  color: var(--theme-text-title);
  margin-bottom: 8rpx;
}

.empty-sub {
  font-size: 24rpx;
  color: var(--theme-text-subtitle);
  margin-bottom: 20rpx;
}

.go-btn {
  width: 100%;
  padding: 24rpx 0;
  border-radius: var(--theme-btn-radius);
  border: none;
  font-size: 28rpx;
  color: #ffffff;
  background-color: #007AFF;
}

.bottom-bar {
  position: fixed;
  left: 0;
  right: 0;
  bottom: 0;
  padding: 20rpx 32rpx 40rpx;
  box-sizing: border-box;
  background-color: rgba(248, 248, 248, 0.98);
  box-shadow: 0 -10rpx 30rpx rgba(0, 122, 255, 0.06);
  display: flex;
  flex-direction: column;
  gap: 16rpx;
}

.bottom-row {
  display: flex;
  align-items: center;
  justify-content: space-between;
}

.bottom-total {
  flex: 1;
  display: flex;
  flex-direction: column;
}

.bottom-label {
  font-size: 22rpx;
  color: var(--theme-text-subtitle);
}

.bottom-value {
  margin-top: 2rpx;
  font-size: 30rpx;
  font-weight: 700;
  color: var(--theme-text-title);
}

.submit-btn {
  width: 100%;
  padding: 24rpx 0;
  border-radius: var(--theme-btn-radius);
  border: none;
  font-size: 28rpx;
  color: #ffffff;
  background-color: #007AFF;
}

.submit-btn:disabled {
  opacity: 0.5;
}

.coupon-sheet {
  padding: 24rpx 24rpx 32rpx;
}

.coupon-sheet-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  margin-bottom: 16rpx;
}

.coupon-sheet-title {
  font-size: 28rpx;
  font-weight: 500;
  color: var(--theme-text-title);
}

.coupon-sheet-all {
  font-size: 26rpx;
  color: #007AFF;
}

.coupon-list {
  max-height: 520rpx;
}

.coupon-item {
  padding: 20rpx 24rpx;
  margin-bottom: 12rpx;
  border-radius: 24rpx;
  background-color: #f5f6fa;
  display: flex;
  align-items: center;
  justify-content: space-between;
}

.coupon-item.disabled {
  opacity: 0.4;
}

.coupon-main {
  display: flex;
  align-items: center;
  column-gap: 16rpx;
}

.coupon-amount {
  font-size: 30rpx;
  font-weight: 600;
  color: #ff4d4f;
}

.coupon-info {
  display: flex;
  flex-direction: column;
  row-gap: 4rpx;
}

.coupon-name {
  font-size: 26rpx;
  color: var(--theme-text-title);
}

.coupon-limit {
  font-size: 24rpx;
  color: var(--theme-text-subtitle);
}

.coupon-confirm {
  margin-top: 20rpx;
  width: 100%;
  padding: 24rpx 0;
  border-radius: var(--theme-btn-radius);
  border: none;
  font-size: 28rpx;
  text-align: center;
  color: #ffffff;
  background-color: #007AFF;
}
</style>

