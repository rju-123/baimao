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

    <!-- 电子签名 -->
    <view class="card upload-card" @tap="chooseContract">
      <view class="section-title">
        电子签名
      </view>
      <view v-if="contractImage" class="contract-preview">
        <image :src="contractImage" mode="aspectFit" />
      </view>
      <view v-else class="contract-placeholder">
        <view class="upload-icon">⬆</view>
        <view class="upload-text">
          点击上传电子签名
        </view>
        <view class="upload-subtext">
          支持 JPG、PNG 格式
        </view>
      </view>
    </view>

    <!-- 优惠券 -->
    <view class="card coupon-card">
      <view class="field-line coupon-header">
        <text class="field-label">优惠券</text>
        <text class="coupon-link" @tap.stop="openCouponSheet">查看全部</text>
      </view>
      <view class="coupon-select" @tap="openCouponSheet">
        <text class="coupon-placeholder">
          {{ couponText }}
        </text>
        <text class="coupon-arrow">›</text>
      </view>
    </view>

    <!-- 金额汇总 -->
    <view class="card summary-card">
      <view class="summary-line">
        <text class="summary-label">产品总额</text>
        <text class="summary-value">￥{{ productTotal }}</text>
      </view>
      <view class="summary-line">
        <text class="summary-label">优惠金额</text>
        <text class="summary-value">-￥{{ couponDiscount }}</text>
      </view>
      <view class="summary-line summary-total">
        <text class="summary-label">实付金额</text>
        <text class="summary-pay">￥{{ payAmount }}</text>
      </view>
    </view>

    <!-- 底部按钮 -->
    <view class="bottom-bar">
      <button class="submit-btn" @tap="submitOrder">
        立即购买
      </button>
    </view>

    <nut-popup v-model:visible="couponVisible" position="bottom" round>
      <view class="coupon-sheet">
        <view class="coupon-sheet-title">
          选择优惠券
        </view>
        <scroll-view scroll-y class="coupon-list">
          <view
            v-for="item in coupons"
            :key="item.id"
            class="coupon-item"
            :class="{ disabled: !isCouponUsable(item), active: selectedCouponId === item.id }"
            @tap="selectCoupon(item)"
          >
            <view class="coupon-main">
              <view class="coupon-amount">
                ￥{{ item.value }}
              </view>
              <view class="coupon-info">
                <view class="coupon-name">
                  {{ item.name }}
                </view>
                <view class="coupon-limit">
                  满 {{ item.minAmount }} 可用
                </view>
              </view>
            </view>
            <view class="coupon-tag">
              {{ item.type === 'service' ? '服务券' : item.type === 'product' ? '产品券' : '通用券' }}
            </view>
          </view>
        </scroll-view>
        <button class="coupon-confirm" @tap="closeCouponSheet">
          完成
        </button>
      </view>
    </nut-popup>
  </view>
  <view v-else class="page loading">
    <view class="theme-text-tips">
      正在加载数据...
    </view>
  </view>
</template>

<script setup lang="ts">
import { onLoad } from '@dcloudio/uni-app';
import { OrderApi, ProductApi } from '@/api';
import { toast } from '@/utils/uni-helpers';
import useUserStore from '@/store/modules/user';

const userStore = useUserStore();

const product = ref<ProductApi.Product | null>(null);
const productId = ref<number | null>(null);
const quantity = ref(1);
const contractImage = ref<string>('');

interface Coupon {
  id: number;
  name: string;
  type: string;
  value: number;
  minAmount: number;
}

const coupons = ref<Coupon[]>([]);
const selectedCouponId = ref<number | null>(null);
const couponDiscount = ref(0);
const couponVisible = ref(false);

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

const payAmount = computed(() => {
  const total = productTotal.value;
  const discount = Math.min(couponDiscount.value, total);
  return total - discount;
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

function openCouponSheet() {
  if (!coupons.value.length) {
    toast('当前暂无可用优惠券');
    return;
  }
  couponVisible.value = true;
}

function closeCouponSheet() {
  couponVisible.value = false;
}

function isCouponUsable(item: Coupon) {
  return productTotal.value >= item.minAmount;
}

function selectCoupon(item: Coupon) {
  if (!isCouponUsable(item)) {
    toast('未满足使用门槛');
    return;
  }
  selectedCouponId.value = item.id;
  couponDiscount.value = item.value;
}

const couponText = computed(() => {
  if (!coupons.value.length)
    return '暂无可用优惠券';
  if (selectedCouponId.value) {
    const c = coupons.value.find(i => i.id === selectedCouponId.value);
    if (c)
      return `已选：立减￥${c.value}`;
  }
  return '选择优惠券';
});

function chooseContract() {
  uni.chooseImage({
    count: 1,
    sizeType: ['compressed'],
    sourceType: ['album', 'camera'],
    success(res) {
      if (res.tempFilePaths && res.tempFilePaths.length > 0)
        contractImage.value = res.tempFilePaths[0];
    },
  });
}

async function submitOrder() {
  const userId = Number(userStore.user_id);
  const companyId = userStore.companyId ?? undefined;
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
    const order = await OrderApi.createOrder({
      userId,
      companyId,
      productId: productId.value,
      // 暂时复用当前用户信息作为订单上的客户信息
      customerName: userStore.user_name || '',
      customerPhone: userStore.phone || '',
      customerCompany: userStore.companyName || '',
      quantity: qty,
      couponDiscount: couponDiscount.value || 0,
    });
    toast('下单成功', 'success');
    setTimeout(() => {
      // 下单后回到“我的订单”Tab
      uni.switchTab({
        url: '/pages/sales/created/index',
      });
    }, 500);
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
  background-color: #f7f8fa;
}

.card {
  padding: 28rpx 32rpx 24rpx;
  margin-bottom: 24rpx;
  border-radius: 24rpx;
  background-color: #ffffff;
  box-shadow: 0 10rpx 30rpx rgba(0, 0, 0, 0.04);
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
  color: #1b233b;
}

.field-value {
  font-size: 26rpx;
  color: #666666;
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

.unit-price {
  font-size: 30rpx;
  font-weight: 600;
  color: #ff4d4f;
}

.upload-card {
  padding-bottom: 32rpx;
}

.section-title {
  margin-bottom: 16rpx;
  font-size: 26rpx;
  color: #1b233b;
}

.contract-preview image {
  width: 100%;
  height: 260rpx;
  border-radius: 16rpx;
  background-color: #f5f6fa;
}

.contract-placeholder {
  padding: 40rpx 24rpx;
  border-radius: 16rpx;
  border: 2rpx dashed #c4c8d6;
  background-color: #f9fafc;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  row-gap: 12rpx;
}

.upload-icon {
  font-size: 40rpx;
  color: #0A7AFF;
}

.upload-text {
  font-size: 26rpx;
  color: #1b233b;
}

.upload-subtext {
  font-size: 24rpx;
  color: #999999;
}

.coupon-card {
  margin-bottom: 24rpx;
}

.coupon-header {
  margin-bottom: 12rpx;
}

.coupon-link {
  font-size: 24rpx;
  color: #0A7AFF;
}

.coupon-select {
  margin-top: 4rpx;
  padding: 18rpx 20rpx;
  border-radius: 16rpx;
  background-color: #f5f6fa;
  display: flex;
  align-items: center;
  justify-content: space-between;
}

.coupon-placeholder {
  font-size: 26rpx;
  color: #666666;
}

.coupon-arrow {
  font-size: 30rpx;
  color: #c0c4cc;
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
  color: #666666;
}

.summary-value {
  font-size: 26rpx;
  color: #1b233b;
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
  padding: 12rpx 32rpx 32rpx;
  box-sizing: border-box;
  background-color: rgba(247, 248, 250, 0.98);
  box-shadow: 0 -4rpx 12rpx rgba(15, 23, 42, 0.04);
}

.submit-btn {
  width: 100%;
  padding: 20rpx 0;
  border-radius: 9999rpx;
  border: none;
  font-size: 30rpx;
  text-align: center;
  color: #ffffff;
  background-color: #0A7AFF;
}

.submit-btn:active {
  opacity: 0.9;
}

.coupon-sheet {
  padding: 24rpx 24rpx 32rpx;
}

.coupon-sheet-title {
  margin-bottom: 16rpx;
  font-size: 28rpx;
  font-weight: 500;
  text-align: center;
  color: #1b233b;
}

.coupon-list {
  max-height: 520rpx;
}

.coupon-item {
  padding: 16rpx 20rpx;
  margin-bottom: 12rpx;
  border-radius: 16rpx;
  background-color: #f5f6fa;
  display: flex;
  align-items: center;
  justify-content: space-between;
}

.coupon-item.disabled {
  opacity: 0.4;
}

.coupon-item.active {
  border: 2rpx solid #0A7AFF;
  background-color: #eef5ff;
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
  color: #1b233b;
}

.coupon-limit {
  font-size: 24rpx;
  color: #999999;
}

.coupon-tag {
  font-size: 24rpx;
  color: #0A7AFF;
}

.coupon-confirm {
  margin-top: 16rpx;
  width: 100%;
  padding: 18rpx 0;
  border-radius: 9999rpx;
  border: none;
  font-size: 28rpx;
  text-align: center;
  color: #ffffff;
  background-color: #0A7AFF;
}

.loading {
  min-height: 100vh;
  display: flex;
  align-items: center;
  justify-content: center;
}
</style>

