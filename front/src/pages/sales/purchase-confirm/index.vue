<template>
  <view class="page" v-if="product">
    <!-- 产品信息 -->
    <view class="card card-main">
      <view class="field-line">
        <text class="field-label">产品名称</text>
        <text class="field-value field-name">
          {{ product.name }}
        </text>
      </view>

      <view class="field-line">
        <text class="field-label">库存</text>
        <text class="field-value">
          <text v-if="inventoryNum > 0">剩余 {{ inventoryNum }} 件</text>
          <text v-else>已售罄</text>
        </text>
      </view>

      <view class="field-line qty-line">
        <text class="field-label">购买数量</text>
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

      <view class="field-line">
        <text class="field-label">产品单价</text>
        <text class="field-value unit-price">￥{{ unitPrice }}</text>
      </view>
    </view>

    <!-- 金额汇总 -->
    <view class="card summary-card">
      <view class="summary-line summary-total">
        <text class="summary-label">产品总额</text>
        <text class="summary-pay">￥{{ productTotal }}</text>
      </view>
    </view>

    <!-- 底部按钮 -->
    <view class="bottom-bar">
      <button class="submit-btn" @tap="addToCart">
        加入购物车
      </button>
    </view>

  </view>
  <view v-else class="page loading">
    <view class="theme-text-tips">
      正在加载数据...
    </view>
  </view>
</template>

<script setup lang="ts">
import { onLoad } from '@dcloudio/uni-app';
import { ProductApi } from '@/api';
import { toast } from '@/utils/uni-helpers';
import useUserStore from '@/store/modules/user';

const userStore = useUserStore();

const product = ref<ProductApi.Product | null>(null);
const productId = ref<number | null>(null);
const quantity = ref(1);
const CART_STORAGE_KEY = 'sales_cart_items';

/** 兼容后端 decimal/库存可能返回字符串 */
function formatPrice(val: number | string | null | undefined): string {
  const n = Number(val);
  return Number.isNaN(n) ? '0' : n.toFixed(0);
}

const inventoryNum = computed(() => {
  if (!product.value || product.value.inventory == null) return 0;
  return Number(product.value.inventory) || 0;
});

const unitPrice = computed(() => {
  if (!product.value) return '0';
  return formatPrice(product.value.discountPrice ?? product.value.price);
});

const maxQty = computed(() => {
  if (!product.value) return 0;
  const inv = inventoryNum.value;
  if (inv <= 0) return Number.MAX_SAFE_INTEGER;
  return inv;
});

const productTotal = computed(() => {
  const qty = quantity.value > 0 ? quantity.value : 1;
  const price = Number(unitPrice.value || '0');
  return qty * price;
});


async function fetchProduct(id: number) {
  try {
    const data = await ProductApi.getProduct(id);
    product.value = data && typeof data === 'object' ? data : null;
  }
  catch {
    toast('加载产品失败');
    product.value = null;
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

async function addToCart() {
  const userId = Number(userStore.user_id);
  if (!userId) {
    toast('请先登录');
    return;
  }
  if (!productId.value) {
    toast('缺少产品信息');
    return;
  }
  if (product.value && inventoryNum.value <= 0) {
    toast('当前产品库存不足，暂不可下单');
    return;
  }
  const qty = quantity.value > 0 ? quantity.value : 1;
  try {
    const cart = loadCart();
    const idx = cart.findIndex((i: any) => Number(i.productId) === Number(productId.value));
    const existingQty = idx >= 0 ? Math.max(0, Number(cart[idx].quantity || 0)) : 0;
    // 加入前刷新一次最新库存，避免分次加入超出库存
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
    const message = err?.message || err?.msg || err?.error || '下单失败，请稍后重试';
    toast(message);
  }
}

onLoad((options: any) => {
  const id = Number(options?.productId);
  if (!id) {
    toast('参数错误，缺少产品ID');
    return;
  }
  productId.value = id;
  const initialQty = Number(options?.quantity || '1');
  if (initialQty > 0)
    quantity.value = initialQty;
  fetchProduct(id);
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
  padding: 32rpx 40rpx 28rpx;
  margin-bottom: 28rpx;
  border-radius: var(--theme-card-radius);
  background-color: #ffffff;
  box-shadow: var(--theme-card-shadow);
}

.card-main {
  margin-bottom: 32rpx;
}

.field-line {
  display: flex;
  align-items: center;
  justify-content: space-between;
  margin-bottom: 16rpx;
}

.field-label {
  font-size: 26rpx;
  color: var(--theme-text-title);
}

.field-value {
  font-size: 26rpx;
  color: var(--theme-text-subtitle);
}

.field-name {
  max-width: 430rpx;
  text-align: right;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
  font-size: 30rpx;
  font-weight: 600;
}

.qty-line {
  margin-top: 8rpx;
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

.unit-price {
  font-size: 30rpx;
  font-weight: 600;
  color: #ff4d4f;
}

.summary-card {
  margin-bottom: 40rpx;
}

.summary-line {
  display: flex;
  align-items: center;
  justify-content: space-between;
  margin-top: 8rpx;
}

.summary-label {
  font-size: 26rpx;
  color: var(--theme-text-subtitle);
}

.summary-value {
  font-size: 26rpx;
  color: var(--theme-text-title);
}

.summary-total {
  margin-top: 16rpx;
  padding-top: 16rpx;
  border-top: 1rpx solid #e5e6eb;
}

.summary-pay {
  font-size: 30rpx;
  font-weight: 600;
  color: #ff4d4f;
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
}

.submit-btn {
  width: 100%;
  padding: 24rpx 0;
  border-radius: var(--theme-btn-radius);
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

