<template>
  <view class="page" v-if="product">
    <view class="card">
      <view class="name">
        {{ product.name }}
      </view>
      <view class="brief">
        {{ product.brief }}
      </view>
      <view class="price-row">
        <text v-if="hasDiscountPrice" class="origin-price">￥{{ formatPrice(product.price) }}</text>
        <text class="price">￥{{ displayPrice }}</text>
      </view>
      <view class="line">
        <text class="label">库存</text>
        <text class="value">
          <text v-if="inventoryNum > 0">剩余 {{ inventoryNum }} 件</text>
          <text v-else>已售罄</text>
        </text>
      </view>
      <view class="line qty-line">
        <text class="label">购买数量</text>
        <view class="qty-stepper">
          <button class="step-btn" :disabled="quantity <= 1" @tap="decrease">
            －
          </button>
          <view class="qty-display">
            {{ quantity }}
          </view>
          <button class="step-btn" :disabled="maxQty > 0 && quantity >= maxQty" @tap="increase">
            ＋
          </button>
        </view>
      </view>
      <view class="line">
        <text class="label">交付时间</text>
        <text class="value">
          {{ deliveryText }}
        </text>
      </view>
    </view>

    <view class="section-title">
      服务详情
    </view>
    <view class="detail">
      {{ product.detail }}
    </view>

    <view class="bottom-bar">
      <button
        class="submit-btn"
        type="button"
        :disabled="isSoldOut"
        @tap.stop="addToCart"
      >
        加入购物车
      </button>
    </view>
  </view>
  <view v-else class="page loading">
    <view class="theme-text-tips" v-if="loadFailed">
      该产品已下架或不存在
    </view>
    <view class="theme-text-tips" v-else>
      正在加载产品详情...
    </view>
  </view>
</template>

<script setup lang="ts">
import { onLoad } from '@dcloudio/uni-app';
import { ProductApi } from '@/api';
import { toast } from '@/utils/uni-helpers';
import useUserStore from '@/store/modules/user';

const CART_STORAGE_KEY = 'sales_cart_items';
const userStore = useUserStore();
const product = ref<ProductApi.Product | null>(null);
const productId = ref<number | null>(null);
const quantity = ref(1);
const loadFailed = ref(false);

/** 兼容后端 decimal 可能返回字符串 */
function formatPrice(val: number | string | null | undefined): string {
  const n = Number(val);
  return Number.isNaN(n) ? '0' : n.toFixed(0);
}

const hasDiscountPrice = computed(() => {
  if (!product.value) return false;
  const v = product.value.discountPrice;
  return v != null && v !== '';
});

const inventoryNum = computed(() => {
  if (!product.value || product.value.inventory == null) return 0;
  return Number(product.value.inventory) || 0;
});

const isSoldOut = computed(() => inventoryNum.value <= 0);

const displayPrice = computed(() => {
  if (!product.value) return '';
  return formatPrice(product.value.discountPrice ?? product.value.price);
});

const maxQty = computed(() => {
  if (!product.value) return 0;
  const inv = inventoryNum.value;
  if (inv <= 0) return Number.MAX_SAFE_INTEGER;
  return inv;
});

const deliveryText = computed(() => {
  if (!product.value || !product.value.deliveryTime)
    return '下单后尽快安排交付';
  return product.value.deliveryTime;
});

const unitPrice = computed(() => {
  if (!product.value) return '0';
  return formatPrice(product.value.discountPrice ?? product.value.price);
});

function loadCart(): any[] {
  try {
    const raw = uni.getStorageSync(CART_STORAGE_KEY);
    const arr = typeof raw === 'string' ? JSON.parse(raw) : raw;
    return Array.isArray(arr) ? arr : [];
  }
  catch {
    return [];
  }
}

function saveCart(list: any[]) {
  uni.setStorageSync(CART_STORAGE_KEY, JSON.stringify(list || []));
}

async function fetchDetail(id: number) {
  try {
    const res = await ProductApi.getProduct(id);
    if (!res) {
      loadFailed.value = true;
      product.value = null;
      return;
    }
    product.value = res;
  }
  catch {
    toast('加载产品详情失败');
    loadFailed.value = true;
  }
}

function decrease() {
  if (quantity.value > 1)
    quantity.value -= 1;
}

function increase() {
  const max = maxQty.value;
  if (max > 0 && quantity.value >= max)
    return;
  quantity.value += 1;
}

async function addToCart() {
  const userId = Number(userStore.user_id);
  if (!userId) {
    toast('请先登录');
    return;
  }
  if (!productId.value) {
    toast('参数错误，请返回重新选择');
    return;
  }
  if (isSoldOut.value) {
    toast('当前产品已售罄，暂不可下单');
    return;
  }
  const qty = quantity.value > 0 ? quantity.value : 1;
  try {
    const cart = loadCart();
    const idx = cart.findIndex((i: any) => Number(i.productId) === Number(productId.value));
    const existingQty = idx >= 0 ? Math.max(0, Number(cart[idx].quantity || 0)) : 0;
    const latest = await ProductApi.getProduct(Number(productId.value));
    const latestInventory = Number(latest?.inventory ?? 0);
    if (latestInventory <= 0) {
      toast('当前产品已售罄，无法加入购物车');
      return;
    }
    if (existingQty + qty > latestInventory) {
      toast(`加入失败，购物车已有 ${existingQty} 件，当前库存仅剩 ${latestInventory} 件`);
      return;
    }
    const item = {
      productId: productId.value,
      productName: latest?.name || product.value?.name || '',
      unitPrice: Number((latest?.discountPrice ?? latest?.price ?? unitPrice.value) || '0'),
      quantity: qty,
      inventory: latestInventory,
      soldOut: latestInventory <= 0,
    };
    if (idx >= 0) {
      cart[idx] = { ...cart[idx], ...item, quantity: Number(cart[idx].quantity || 0) + qty };
    } else {
      cart.push(item);
    }
    saveCart(cart);
    toast('产品已加入购物车', 'success');
  }
  catch (err: any) {
    toast(err?.message || err?.msg || err?.error || '加入购物车失败');
  }
}

onLoad((options: any) => {
  const id = Number(options?.id);
  if (!id) {
    toast('参数错误，缺少产品ID');
    return;
  }
  productId.value = id;
  fetchDetail(id);
});
</script>

<style scoped lang="scss">
.page {
  min-height: 100vh;
  padding: 32rpx 32rpx 120rpx;
  box-sizing: border-box;
  background: linear-gradient(180deg, var(--theme-bg-gradient-start) 0%, var(--theme-bg-gradient-end) 100%);
}

.card {
  padding: 28rpx 32rpx 24rpx;
  margin-bottom: 32rpx;
  border-radius: var(--theme-card-radius);
  background-color: #ffffff;
  box-shadow: var(--theme-card-shadow);
}

.name {
  margin-bottom: 12rpx;
  font-size: 32rpx;
  font-weight: 600;
  color: var(--theme-text-title);
}

.brief {
  margin-top: 8rpx;
  font-size: 26rpx;
  line-height: 40rpx;
  color: #666666;
}

.price-row {
  margin-top: 20rpx;
  display: flex;
  align-items: flex-end;
  gap: 12rpx;
}

.price {
  font-size: 34rpx;
  font-weight: 600;
  color: #ff4d4f;
}

.origin-price {
  font-size: 24rpx;
  color: #999999;
  text-decoration: line-through;
}

.line {
  margin-top: 16rpx;
  display: flex;
  align-items: center;
  justify-content: space-between;
}

.label {
  font-size: 26rpx;
  color: var(--theme-text-title);
}

.value {
  font-size: 26rpx;
  color: #666666;
}

.qty-line {
  margin-top: 20rpx;
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

.section-title {
  margin-bottom: 12rpx;
  font-size: 28rpx;
  font-weight: 500;
  color: var(--theme-text-title);
}

.detail {
  padding: 20rpx 24rpx;
  border-radius: 24rpx;
  font-size: 26rpx;
  line-height: 40rpx;
  background-color: #ffffff;
  color: #666666;
  white-space: pre-wrap;
}

.bottom-bar {
  position: fixed;
  left: 0;
  right: 0;
  bottom: 0;
  padding: 12rpx 32rpx 32rpx;
  box-sizing: border-box;
  background: linear-gradient(to top, rgba(247, 248, 250, 0.96), rgba(247, 248, 250, 0.6), transparent);
}

.submit-btn {
  width: 100%;
  padding: 20rpx 0;
  border-radius: 9999rpx;
  border: none;
  font-size: 30rpx;
  text-align: center;
  color: #ffffff;
  background-color: #007AFF;
}

.submit-btn:active {
  opacity: 0.9;
}

.loading {
  min-height: 100vh;
  display: flex;
  align-items: center;
  justify-content: center;
}
</style>

