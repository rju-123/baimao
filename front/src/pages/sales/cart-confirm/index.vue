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
        <view class="product-head" @tap="toggle(index)">
          <view class="head-left">
            <view class="badge">商品 {{ index + 1 }}</view>
            <view class="name">{{ item.productName || `产品 #${item.productId}` }}</view>
          </view>
          <view class="chev">
            {{ expanded[index] ? '▾' : '▸' }}
          </view>
        </view>

        <view v-if="expanded[index]" class="product-body">
          <view class="line">
            <text class="k">产品名称</text>
            <text class="v">{{ item.productName || `产品 #${item.productId}` }}</text>
          </view>
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
            <view class="line" v-if="item.couponId">
            <text class="k">优惠券</text>
              <text class="v coupon">
                {{ item.couponName || `#${item.couponId}` }} -￥{{ formatAmount(calcItemDiscount(item)) }}
              </text>
          </view>
          <view class="line pay">
            <text class="k">实付金额</text>
            <text class="v pay">￥{{ formatAmount(calcItemPay(item)) }}</text>
          </view>
        </view>
      </view>

      <view class="card sign">
        <view class="section-title">电子签名</view>
        <view class="upload" @tap="chooseSign">
          <view v-if="signImage" class="preview">
            <image :src="signImage" mode="aspectFit" />
          </view>
          <view v-else class="placeholder">
            <view class="icon">↑</view>
            <view class="text">点击上传电子签名</view>
            <view class="subtext">支持 JPG、PNG 格式，此签名将应用于所有商品</view>
          </view>
        </view>
        <view class="sign-status">
          <view class="status-left">
            <text v-if="!signImage" class="status-text">未上传电子签名</text>
            <text v-else class="status-text ok">已上传电子签名</text>
          </view>
          <view class="status-right">
            <text class="sum-label2">合计</text>
            <text class="sum-value2">￥{{ formatAmount(totalPay) }}</text>
          </view>
        </view>
      </view>
    </view>

    <view v-else class="card empty">
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
      <button class="submit-btn" :disabled="submitting || !items.length || !signImage" @tap="submit">
        {{ submitting ? '提交中...' : '确认下单' }}
      </button>
    </view>
  </view>
</template>

<script setup lang="ts">
import { onShow } from '@dcloudio/uni-app';
import { post } from '@/utils/request';
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
  couponType?: string;
  couponMinAmount?: number;
}

const userStore = useUserStore();
const items = ref<CartItem[]>([]);
const expanded = ref<Record<number, boolean>>({});
const signImage = ref<string>('');
const submitting = ref(false);

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
  const map: Record<number, boolean> = {};
  for (let i = 0; i < items.value.length; i++)
    map[i] = true;
  expanded.value = map;
}

function toggle(index: number) {
  expanded.value = { ...expanded.value, [index]: !expanded.value[index] };
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

function chooseSign() {
  uni.chooseImage({
    count: 1,
    sizeType: ['compressed'],
    sourceType: ['album', 'camera'],
    success(res) {
      const p = res.tempFilePaths?.[0];
      if (p)
        signImage.value = p;
    },
  });
}

function goCart() {
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
  if (!signImage.value) {
    toast('请先上传电子签名');
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

    // 3) 清空购物车并跳转订单详情
    uni.removeStorageSync(CART_STORAGE_KEY);
    toast('下单成功', 'success');
    setTimeout(() => {
      if (orderId) {
        uni.navigateTo({
          url: `/pages/sales/order-detail/index?id=${encodeURIComponent(String(orderId))}`,
        });
      } else {
        uni.switchTab({ url: '/pages/sales/created/index' });
      }
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
  display: flex;
  justify-content: space-between;
  align-items: flex-end;
  margin-bottom: 16rpx;
}

.title {
  font-size: 34rpx;
  font-weight: 700;
  color: #111827;
}

.sub {
  margin-top: 6rpx;
  font-size: 24rpx;
  color: #6b7280;
}

.sum-label {
  font-size: 22rpx;
  color: #6b7280;
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
  gap: 16rpx;
}

.card {
  padding: 22rpx 24rpx;
  border-radius: 24rpx;
  background-color: #ffffff;
  box-shadow: 0 10rpx 30rpx rgba(0, 0, 0, 0.04);
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
  color: #2563eb;
  background: #eff6ff;
  padding: 6rpx 10rpx;
  border-radius: 9999rpx;
}

.name {
  font-size: 28rpx;
  font-weight: 700;
  color: #111827;
  overflow: hidden;
  white-space: nowrap;
  text-overflow: ellipsis;
}

.chev {
  font-size: 28rpx;
  color: #6b7280;
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
  margin-top: 10rpx;
  font-size: 24rpx;
}

.k {
  color: #6b7280;
}

.v {
  color: #111827;
  font-weight: 500;
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

.line.pay .v.pay {
  color: #ef4444;
  font-weight: 700;
}

.sign .section-title {
  font-size: 26rpx;
  font-weight: 700;
  color: #111827;
  margin-bottom: 12rpx;
}

.upload {
  border-radius: 20rpx;
  border: 2rpx dashed #c4c8d6;
  background: #f9fafc;
  padding: 24rpx;
}

.placeholder {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 10rpx;
}

.icon {
  font-size: 44rpx;
  color: #6b7280;
}

.text {
  font-size: 26rpx;
  color: #111827;
}

.subtext {
  font-size: 22rpx;
  color: #6b7280;
  text-align: center;
}

.preview image {
  width: 100%;
  height: 240rpx;
  border-radius: 16rpx;
  background: #f5f6fa;
}

.sign-status {
  margin-top: 14rpx;
  padding-top: 14rpx;
  border-top: 1rpx solid #f3f4f6;
  display: flex;
  justify-content: space-between;
  align-items: center;
}

.status-text {
  font-size: 24rpx;
  color: #6b7280;
}

.status-text.ok {
  color: #16a34a;
  font-weight: 600;
}

.sum-label2 {
  font-size: 22rpx;
  color: #6b7280;
}

.sum-value2 {
  margin-left: 12rpx;
  font-size: 28rpx;
  font-weight: 700;
  color: #ef4444;
}

.empty-title {
  font-size: 28rpx;
  font-weight: 700;
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
  flex-direction: column;
  gap: 12rpx;
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
  color: #6b7280;
}

.bottom-value {
  margin-top: 2rpx;
  font-size: 30rpx;
  font-weight: 700;
  color: #111827;
}

.submit-btn {
  width: 100%;
  padding: 18rpx 0;
  border-radius: 9999rpx;
  border: none;
  font-size: 28rpx;
  color: #ffffff;
  background-color: #0A7AFF;
}

.submit-btn:disabled {
  opacity: 0.5;
}
</style>

