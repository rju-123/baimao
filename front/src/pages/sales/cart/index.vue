<template>
  <view class="page">
    <view class="header">
      <view class="title">
        购物车
      </view>
      <view class="sub">
        支持多商品一次下单
      </view>
    </view>

    <view v-if="items.length" class="list">
      <view
        v-for="(item, index) in items"
        :key="`${item.productId}-${index}`"
        class="card item"
      >
        <view class="row top">
          <view class="name">
            {{ item.productName || `产品 #${item.productId}` }}
          </view>
          <view class="remove" @tap.stop="removeItem(index)">
            删除
          </view>
        </view>

        <view class="row mid">
          <view class="price">
            ￥{{ formatAmount(item.unitPrice) }}
          </view>
          <view class="qty-stepper">
            <button class="step-btn" :disabled="item.quantity <= 1" @tap="setQty(index, item.quantity - 1)">
              －
            </button>
            <view class="qty-display">
              {{ item.quantity }}
            </view>
            <button class="step-btn" @tap="setQty(index, item.quantity + 1)">
              ＋
            </button>
          </view>
        </view>

        <view class="coupon" v-if="item.couponId">
          <text class="coupon-label">优惠券：</text>
          <text class="coupon-value">{{ item.couponName || `#${item.couponId}` }}</text>
        </view>

        <view class="row bottom">
          <view class="subtotal-label">
            小计
          </view>
          <view class="subtotal">
            ￥{{ formatAmount(calcItemPay(item)) }}
          </view>
        </view>
      </view>
    </view>

    <view v-else class="card empty">
      <view class="empty-title">
        购物车为空
      </view>
      <view class="empty-sub">
        先去下单页面挑选商品加入购物车
      </view>
      <button class="go-btn" @tap="goOrder">
        去下单
      </button>
    </view>

    <view v-if="items.length" class="bottom-bar">
      <view class="total">
        <text class="total-label">合计</text>
        <text class="total-value">￥{{ formatAmount(totalPay) }}</text>
      </view>
      <button class="checkout-btn" @tap="checkout">
        去结算
      </button>
    </view>
  </view>
</template>

<script setup lang="ts">
import { onShow } from '@dcloudio/uni-app';
import { toast } from '@/utils/uni-helpers';
import useUserStore from '@/store/modules/user';

const CART_STORAGE_KEY = 'sales_cart_items';

interface CartItem {
  productId: number;
  productName: string;
  unitPrice: number;
  quantity: number;
  couponId?: number | null;
  couponName?: string;
  couponValue?: number;
  couponType?: string; // amount | discount
  couponMinAmount?: number;
}

const userStore = useUserStore();
const items = ref<CartItem[]>([]);

function goOrder() {
  uni.switchTab({ url: '/pages/sales/order/index' });
}

function loadCart(): CartItem[] {
  try {
    const raw = uni.getStorageSync(CART_STORAGE_KEY);
    const arr = typeof raw === 'string' ? JSON.parse(raw) : raw;
    return Array.isArray(arr) ? arr : [];
  } catch {
    return [];
  }
}

function saveCart(list: CartItem[]) {
  uni.setStorageSync(CART_STORAGE_KEY, JSON.stringify(list || []));
}

function refresh() {
  items.value = loadCart();
}

function removeItem(index: number) {
  const list = loadCart();
  list.splice(index, 1);
  saveCart(list);
  refresh();
}

function setQty(index: number, qty: number) {
  const list = loadCart();
  const item = list[index];
  if (!item) return;
  item.quantity = Math.max(1, Number(qty || 1));
  list[index] = item;
  saveCart(list);
  refresh();
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
  if (type === 'discount') {
    // v=0.9 -> 9折，discount=amount*(1-v)
    return Math.max(0, Math.round(amount * (1 - v)));
  }
  // 默认满减/直减：v=100 -> 减100
  return Math.max(0, Math.min(amount, v));
}

function calcItemPay(item: CartItem): number {
  const amount = calcItemAmount(item);
  const discount = calcItemDiscount(item);
  return Math.max(0, amount - discount);
}

const totalPay = computed(() => {
  return items.value.reduce((sum, it) => sum + calcItemPay(it), 0);
});

async function checkout() {
  const userId = Number(userStore.user_id || 0);
  if (!userId) {
    toast('请先登录');
    return;
  }
  const list = loadCart();
  if (!list.length) {
    toast('购物车为空');
    return;
  }
  uni.navigateTo({
    url: '/pages/sales/cart-confirm/index',
  });
}

onShow(() => {
  refresh();
});
</script>

<style scoped lang="scss">
.page {
  min-height: 100vh;
  padding: 24rpx 24rpx 160rpx;
  box-sizing: border-box;
  background-color: #f7f8fa;
}

.header {
  margin-bottom: 16rpx;
}

.title {
  font-size: 34rpx;
  font-weight: 600;
  color: #111827;
}

.sub {
  margin-top: 6rpx;
  font-size: 24rpx;
  color: #6b7280;
}

.card {
  padding: 28rpx 28rpx 32rpx;
  border-radius: 24rpx;
  background-color: #ffffff;
  box-shadow: 0 10rpx 30rpx rgba(0, 0, 0, 0.04);
}

.list {
  display: flex;
  flex-direction: column;
  gap: 16rpx;
}

.item {
  padding: 22rpx 24rpx;
}

.row {
  display: flex;
  align-items: center;
  justify-content: space-between;
}

.top {
  margin-bottom: 14rpx;
}

.name {
  flex: 1;
  font-size: 28rpx;
  font-weight: 600;
  color: #111827;
  margin-right: 16rpx;
  overflow: hidden;
  white-space: nowrap;
  text-overflow: ellipsis;
}

.remove {
  font-size: 24rpx;
  color: #ef4444;
}

.mid {
  margin-bottom: 12rpx;
}

.price {
  font-size: 26rpx;
  font-weight: 600;
  color: #ff3b30;
}

.qty-stepper {
  display: flex;
  align-items: center;
  border-radius: 9999rpx;
  border: 1rpx solid #e5e6eb;
  overflow: hidden;
}

.step-btn {
  width: 64rpx;
  height: 56rpx;
  line-height: 56rpx;
  text-align: center;
  font-size: 32rpx;
  border: none;
  background-color: #f5f6fa;
  color: #1b233b;
}

.step-btn:disabled {
  color: #c0c4cc;
}

.qty-display {
  min-width: 72rpx;
  padding: 0 12rpx;
  text-align: center;
  font-size: 28rpx;
  color: #1b233b;
  background-color: #ffffff;
}

.coupon {
  margin-bottom: 12rpx;
  font-size: 24rpx;
  color: #6b7280;
}

.coupon-label {
  color: #6b7280;
}

.coupon-value {
  color: #111827;
  font-weight: 500;
}

.bottom {
  padding-top: 10rpx;
  border-top: 1rpx solid #f3f4f6;
}

.subtotal-label {
  font-size: 24rpx;
  color: #6b7280;
}

.subtotal {
  font-size: 28rpx;
  font-weight: 600;
  color: #111827;
}

.empty-title {
  font-size: 28rpx;
  font-weight: 600;
  color: #111827;
  margin-bottom: 8rpx;
}

.empty-sub {
  font-size: 24rpx;
  color: #6b7280;
  margin-bottom: 20rpx;
}

.go-btn {
  width: 100%;
  padding: 18rpx 0;
  border-radius: 9999rpx;
  border: none;
  font-size: 28rpx;
  color: #ffffff;
  background-color: #0A7AFF;
}

.go-btn:active {
  opacity: 0.9;
}

.bottom-bar {
  position: fixed;
  left: 0;
  right: 0;
  bottom: 0;
  padding: 16rpx 24rpx 32rpx;
  box-sizing: border-box;
  background-color: rgba(247, 248, 250, 0.98);
  box-shadow: 0 -4rpx 12rpx rgba(15, 23, 42, 0.04);
  display: flex;
  align-items: center;
  gap: 16rpx;
}

.total {
  flex: 1;
  display: flex;
  flex-direction: column;
}

.total-label {
  font-size: 22rpx;
  color: #6b7280;
}

.total-value {
  margin-top: 2rpx;
  font-size: 30rpx;
  font-weight: 700;
  color: #111827;
}

.checkout-btn {
  padding: 18rpx 28rpx;
  border-radius: 9999rpx;
  border: none;
  font-size: 28rpx;
  color: #ffffff;
  background-color: #0A7AFF;
}

.checkout-btn:active {
  opacity: 0.9;
}
</style>

