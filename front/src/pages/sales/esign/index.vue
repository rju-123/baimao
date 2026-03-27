<template>
  <view class="page">
    <view class="card" v-if="flow">
      <view class="title">下单确认</view>
      <view class="sub">请确认本次下单内容，确认后进入电子签签署（当前为占位）。</view>

      <view class="section">
        <view class="section-title">商品明细</view>
        <view class="item" v-for="(it, idx) in flow.payload.items" :key="`${it.productId}-${idx}`">
          <view class="item-top">
            <view class="item-name">{{ it.productName || `产品 #${it.productId}` }}</view>
            <view class="item-qty">x{{ it.quantity }}</view>
          </view>
          <view class="item-sub">
            <view class="item-line">
              <text class="k">单价</text>
              <text class="v">￥{{ formatAmount(it.unitPrice) }}</text>
            </view>
            <view class="item-line" v-if="it.couponId">
              <text class="k">优惠券</text>
              <text class="v">{{ it.couponName || `#${it.couponId}` }}</text>
            </view>
          </view>
        </view>
      </view>

      <view class="section">
        <view class="section-title">金额汇总</view>
        <view class="sum-line">
          <text class="k">商品总额</text>
          <text class="v">￥{{ formatAmount(flow.pricing.amount) }}</text>
        </view>
        <view class="sum-line">
          <text class="k">优惠金额</text>
          <text class="v">-￥{{ formatAmount(flow.pricing.discountAmount) }}</text>
        </view>
        <view class="sum-line total">
          <text class="k">实付金额</text>
          <text class="v">￥{{ formatAmount(flow.pricing.payAmount) }}</text>
        </view>
      </view>

      <view class="section">
        <view class="section-title">电子签签署（占位）</view>
        <view class="placeholder">
          这里后续接入第三方电子签 SDK / H5 嵌入页。
        </view>
        <button class="btn secondary" :disabled="loading" @tap="startSigning">
          {{ signed ? '已进入签署' : '开始签署' }}
        </button>
        <button class="btn primary" :disabled="loading || !signed" @tap="complete">
          {{ loading ? '处理中...' : '签署完成并创建订单' }}
        </button>
      </view>
    </view>

    <view class="card" v-else>
      <view class="title">下单确认</view>
      <view class="sub">正在加载签署流程...</view>
    </view>
  </view>
</template>

<script setup lang="ts">
import { onLoad } from '@dcloudio/uni-app';
import { get, post } from '@/utils/request';
import { toast } from '@/utils/uni-helpers';

const flowId = ref<string>('');
const loading = ref(false);
const signed = ref(false);
const CART_STORAGE_KEY = 'sales_cart_items';

interface FlowItem {
  productId: number;
  productName?: string;
  unitPrice?: number;
  quantity: number;
  couponId?: number | null;
  couponName?: string;
  couponType?: string;
  couponValue?: number;
  couponMinAmount?: number;
}

interface FlowDetail {
  flowId: string;
  createdAt: number;
  payload: { userId: number; companyId?: number; items: FlowItem[] };
  pricing: { amount: number; discountAmount: number; payAmount: number };
}

const flow = ref<FlowDetail | null>(null);

function formatAmount(val: number | string | null | undefined): string {
  const n = Number(val);
  return Number.isNaN(n) ? '0' : n.toFixed(0);
}

async function fetchFlow() {
  if (!flowId.value)
    return;
  try {
    const data = await get<FlowDetail>(`/esign/flows/${encodeURIComponent(flowId.value)}`);
    flow.value = data;
  } catch (e: any) {
    console.error('load flow error', e);
    toast(e?.message || '加载签署流程失败');
    flow.value = null;
  }
}

function startSigning() {
  // 占位：真实接入时这里跳转第三方签署页面/组件
  signed.value = true;
  toast('已进入签署（占位）', 'success');
}

async function complete() {
  if (!flowId.value) {
    toast('缺少签署流程ID');
    return;
  }
  if (loading.value)
    return;
  loading.value = true;
  try {
    await post<{ orderId: number }>('/esign/flows/complete', {
      data: { flowId: flowId.value },
    });
    // 创建订单成功后清空购物车（本地存储）并进入「我的订单」，不进入订单详情、不保留其他页面
    try {
      uni.removeStorageSync(CART_STORAGE_KEY);
    } catch {}
    toast('签署完成，订单已创建', 'success');
    setTimeout(() => {
      uni.reLaunch({ url: '/pages/sales/created/index' });
    }, 400);
  } catch (e: any) {
    console.error('complete esign error', e);
    toast(e?.message || '签署完成处理失败');
  } finally {
    loading.value = false;
  }
}

onLoad((options: any) => {
  if (options?.flowId)
    flowId.value = String(options.flowId);
  fetchFlow();
});
</script>

<style scoped lang="scss">
.page {
  min-height: 100vh;
  padding: 24rpx;
  box-sizing: border-box;
  background: linear-gradient(180deg, var(--theme-bg-gradient-start) 0%, var(--theme-bg-gradient-end) 100%);
}

.card {
  padding: 28rpx 28rpx 32rpx;
  border-radius: var(--theme-card-radius);
  background-color: #ffffff;
  box-shadow: var(--theme-card-shadow);
}

.title {
  font-size: 32rpx;
  font-weight: 700;
  color: #111827;
}

.sub {
  margin-top: 10rpx;
  font-size: 24rpx;
  color: #6b7280;
}

.section {
  margin-top: 22rpx;
  padding-top: 18rpx;
  border-top: 1rpx solid #f3f4f6;
}

.btn {
  margin-top: 14rpx;
  width: 100%;
  padding: 18rpx 0;
  border-radius: 9999rpx;
  border: none;
  font-size: 28rpx;
  color: #ffffff;
}

.btn.primary {
  background-color: #007AFF;
}

.btn.secondary {
  background-color: #111827;
}

.btn:disabled {
  opacity: 0.6;
}

.section-title {
  font-size: 26rpx;
  font-weight: 600;
  color: #111827;
  margin-bottom: 12rpx;
}

.item {
  padding: 16rpx 18rpx;
  border-radius: 16rpx;
  background-color: #f5f6fa;
  margin-bottom: 12rpx;
}

.item-top {
  display: flex;
  justify-content: space-between;
  align-items: center;
}

.item-name {
  flex: 1;
  font-size: 26rpx;
  font-weight: 600;
  color: #111827;
  margin-right: 12rpx;
  overflow: hidden;
  white-space: nowrap;
  text-overflow: ellipsis;
}

.item-qty {
  font-size: 24rpx;
  color: #6b7280;
}

.item-sub {
  margin-top: 8rpx;
}

.item-line,
.sum-line {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-top: 6rpx;
  font-size: 24rpx;
}

.k {
  color: #6b7280;
}

.v {
  color: #111827;
  font-weight: 500;
}

.sum-line.total .v {
  font-size: 28rpx;
  font-weight: 700;
}

.placeholder {
  padding: 16rpx 18rpx;
  border-radius: 16rpx;
  background-color: #f5f6fa;
  color: #6b7280;
  font-size: 24rpx;
}
</style>

