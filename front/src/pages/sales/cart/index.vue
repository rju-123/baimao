<template>
  <view class="page">
    <view v-if="items.length" class="cart-header">
      <view class="cart-title">购物车</view>
      <view class="edit-toggle" @tap="toggleEdit">
        {{ isEditing ? '完成' : '编辑' }}
      </view>
    </view>
    <view v-if="items.length" class="list">
      <view
        v-for="(item, index) in items"
        :key="`${item.productId}-${index}`"
        class="card item"
        :class="{ soldout: item.soldOut }"
      >
        <view v-if="isEditing" class="edit-check" @tap="toggleSelect(index)">
          <view class="checkbox" :class="{ checked: selectedIndexes.has(index) }">✓</view>
        </view>
        <view class="item-content">
          <view class="row top">
            <view class="name">
              {{ item.productName || `产品 #${item.productId}` }}
            </view>
            <view v-if="item.soldOut" class="tag">
              已售罄
            </view>
          </view>

          <view v-if="!isEditing" class="row mid">
          <view class="price">
            ￥{{ formatAmount(item.unitPrice) }}
          </view>
          <view class="qty-stepper">
            <button class="step-btn" @tap="setQty(index, item.quantity - 1)">
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
        <view v-else class="row mid edit-row">
          <view class="price">￥{{ formatAmount(item.unitPrice) }}</view>
          <view class="edit-qty">x{{ item.quantity }}</view>
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
      <template v-if="!isEditing">
        <view class="total">
          <text class="total-label">合计</text>
          <text class="total-value">￥{{ formatAmount(totalPay) }}</text>
        </view>
        <button class="checkout-btn" @tap="checkout">
          去结算
        </button>
      </template>
      <template v-else>
        <view class="total">
          <text class="total-label">已选 {{ selectedIndexes.size }} 件</text>
        </view>
        <button
          class="delete-btn"
          :disabled="selectedIndexes.size === 0"
          @tap="batchDelete"
        >
          删除
        </button>
      </template>
    </view>
  </view>
</template>

<script setup lang="ts">
import { onShow } from '@dcloudio/uni-app';
import { toast } from '@/utils/uni-helpers';
import useUserStore from '@/store/modules/user';
import { CouponApi, ProductApi } from '@/api';

const CART_STORAGE_KEY = 'sales_cart_items';

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
const isEditing = ref(false);
const selectedIndexes = ref<Set<number>>(new Set());

function toggleEdit() {
  isEditing.value = !isEditing.value;
  if (!isEditing.value)
    selectedIndexes.value = new Set();
}

function toggleSelect(index: number) {
  const next = new Set(selectedIndexes.value);
  if (next.has(index))
    next.delete(index);
  else
    next.add(index);
  selectedIndexes.value = next;
}

async function batchDelete() {
  const toDelete = Array.from(selectedIndexes.value).sort((a, b) => b - a);
  if (!toDelete.length) return;
  const list = loadCart();
  for (const idx of toDelete) {
    const item = list[idx];
    if (item?.couponId)
      await unlockItemCoupon(item);
  }
  for (const idx of toDelete)
    list.splice(idx, 1);
  saveCart(list);
  selectedIndexes.value = new Set();
  isEditing.value = false;
  refresh();
  refreshStocks();
  toast('已删除');
}

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

async function refreshStocks() {
  const list = loadCart();
  const ids = Array.from(new Set(list.map(i => Number(i.productId || 0)).filter(n => n > 0)));
  if (!ids.length) {
    items.value = list;
    return list;
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
    saveCart(next);
    return next;
  }
  catch (e) {
    // 获取库存失败时不阻断使用，保留原购物车展示
    items.value = list;
    return list;
  }
}

async function unlockItemCoupon(item: CartItem) {
  if (!item?.couponId) return;
  try {
    await CouponApi.unlockCoupon(item.couponId, Number(userStore.user_id || 0));
  }
  catch (e) {
    console.warn('unlock coupon failed', e);
  }
}

async function setQty(index: number, qty: number) {
  const list = loadCart();
  const item = list[index];
  if (!item) return;
  const nextQty = Number(qty || 1);

  if (nextQty <= 0) {
    await unlockItemCoupon(item);
    list.splice(index, 1);
    saveCart(list);
    refresh();
    refreshStocks();
    return;
  }

  const inventory = Number(item.inventory ?? 0);
  if (inventory > 0 && nextQty > inventory) {
    toast(`当前库存仅剩 ${inventory} 件`);
    item.quantity = inventory;
  }
  else {
    item.quantity = nextQty;
  }
  list[index] = item;
  saveCart(list);
  refreshStocks();
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
  const latestItems = await refreshStocks();
  // 如果有已售罄商品，禁止进入确认购买页
  const hasSoldOut = (latestItems || []).some(i => i.soldOut);
  if (hasSoldOut) {
    toast('购物车中存在已售罄商品，请先移除后再结算');
    return;
  }
  const hasOverInventory = (latestItems || []).some(i => {
    const inventory = Number(i.inventory ?? 0);
    return inventory > 0 && Number(i.quantity || 0) > inventory;
  });
  if (hasOverInventory) {
    toast('购物车中存在超出库存数量的商品，请先调整数量');
    return;
  }
  uni.navigateTo({
    url: '/pages/sales/cart-confirm/index',
  });
}

onShow(() => {
  refreshStocks();
});
</script>

<style scoped lang="scss">
.page {
  min-height: 100vh;
  padding: 32rpx 32rpx 160rpx;
  box-sizing: border-box;
  background: linear-gradient(180deg, var(--theme-bg-gradient-start) 0%, var(--theme-bg-gradient-end) 100%);
}

.card {
  padding: 32rpx 32rpx 36rpx;
  border-radius: var(--theme-card-radius);
  background-color: #ffffff;
  box-shadow: var(--theme-card-shadow);
}

.soldout {
  opacity: 0.6;
}

.tag {
  flex-shrink: 0;
  margin-right: 16rpx;
  padding: 4rpx 10rpx;
  border-radius: 9999rpx;
  font-size: 22rpx;
  color: #b91c1c;
  background-color: #fee2e2;
}
.list {
  display: flex;
  flex-direction: column;
  gap: 16rpx;
}

.cart-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 24rpx 32rpx 16rpx;
}

.cart-title {
  font-size: 34rpx;
  font-weight: 700;
  color: var(--theme-text-title);
}

.edit-toggle {
  font-size: 28rpx;
  color: #007AFF;
}

.item {
  padding: 22rpx 24rpx;
  display: flex;
  flex-wrap: wrap;
}

.edit-check {
  width: 56rpx;
  height: 56rpx;
  margin-right: 16rpx;
  display: flex;
  align-items: center;
  justify-content: center;
}

.checkbox {
  width: 40rpx;
  height: 40rpx;
  border: 2rpx solid #ddd;
  border-radius: 50%;
  font-size: 24rpx;
  color: transparent;
  display: flex;
  align-items: center;
  justify-content: center;
}

.checkbox.checked {
  border-color: #007AFF;
  background-color: #007AFF;
  color: #fff;
}

.item-content {
  flex: 1;
  min-width: 0;
}

.item .row {
  width: 100%;
}

.edit-row {
  display: flex;
  align-items: center;
  gap: 16rpx;
}

.edit-qty {
  font-size: 26rpx;
  color: var(--theme-text-subtitle);
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
  color: var(--theme-text-title);
  margin-right: 16rpx;
  overflow: hidden;
  white-space: nowrap;
  text-overflow: ellipsis;
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
  border-radius: var(--theme-btn-radius);
  border: 1rpx solid #E0E0E0;
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
  color: var(--theme-text-title);
}

.step-btn:disabled {
  color: #c0c4cc;
}

.qty-display {
  min-width: 72rpx;
  padding: 0 12rpx;
  text-align: center;
  font-size: 28rpx;
  color: var(--theme-text-title);
  background-color: #ffffff;
}

.bottom {
  padding-top: 10rpx;
  border-top: 1rpx solid #f3f4f6;
}

.subtotal-label {
  font-size: 24rpx;
  color: var(--theme-text-subtitle);
}

.subtotal {
  font-size: 28rpx;
  font-weight: 600;
  color: var(--theme-text-title);
}

.empty-title {
  font-size: 28rpx;
  font-weight: 600;
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

.go-btn:active {
  opacity: 0.9;
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
  align-items: center;
  gap: 20rpx;
}

.total {
  flex: 1;
  display: flex;
  flex-direction: column;
}

.total-label {
  font-size: 22rpx;
  color: var(--theme-text-subtitle);
}

.total-value {
  margin-top: 2rpx;
  font-size: 30rpx;
  font-weight: 700;
  color: var(--theme-text-title);
}

.checkout-btn {
  padding: 24rpx 36rpx;
  border-radius: var(--theme-btn-radius);
  border: none;
  font-size: 28rpx;
  color: #ffffff;
  background-color: #007AFF;
}

.checkout-btn:active {
  opacity: 0.9;
}

.delete-btn {
  padding: 24rpx 36rpx;
  border-radius: var(--theme-btn-radius);
  border: none;
  font-size: 28rpx;
  color: #fff;
  background-color: #ef4444;
}

.delete-btn:disabled {
  opacity: 0.5;
}
</style>

