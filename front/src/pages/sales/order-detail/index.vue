<template>
  <view class="page" v-if="order">
    <!-- 顶部订单信息 -->
    <view class="card card-header">
      <view class="header-top">
        <view class="header-title">
          {{ order.productName }}
        </view>
        <view class="header-status" :class="`status-${order.status}`">
          {{ statusText }}
        </view>
      </view>
      <view class="header-meta">
        <view class="meta-row">
          <text class="meta-label">订单号：</text>
          <text class="meta-value">{{ order.orderNo }}</text>
        </view>
        <view class="meta-row">
          <text class="meta-label">创建时间：</text>
          <text class="meta-value">{{ formatOrderTime(order) }}</text>
        </view>
      </view>
    </view>

    <!-- 订单内容 -->
    <view class="card">
      <view class="section-title">
        订单内容
      </view>
      <view class="content-row">
        <view class="content-name">
          {{ order.productName }} × {{ order.quantity }}
        </view>
        <view class="content-amount">
          ￥{{ formatAmount(order.payAmount) }}
        </view>
      </view>
    </view>

    <!-- 订单详情 -->
    <view class="card">
      <view class="section-title">
        订单详情
      </view>
      <view class="detail-text">
        {{ order.productDetail || product?.detail || '该产品已下架，详细信息不可用' }}
      </view>
    </view>

    <!-- 接单人信息（白帽子） -->
    <view class="card">
      <view class="section-title">
        接单人
      </view>
      <view class="info-row">
        <text class="info-label">姓名</text>
        <text class="info-value">
          {{ order.whitehatName || '暂未指派' }}
        </text>
      </view>
      <view class="info-row">
        <text class="info-label">联系电话</text>
        <text class="info-value">
          {{ order.whitehatPhone || '—' }}
        </text>
      </view>
    </view>

    <!-- 电子合同 -->
    <view class="card">
      <view class="section-title">
        电子合同
      </view>
      <view class="contract-actions">
        <button class="contract-btn secondary">
          查看
        </button>
        <button class="contract-btn primary">
          下载
        </button>
      </view>
    </view>
  </view>
  <view v-else class="page loading">
    <view class="theme-text-tips">
      正在加载订单详情...
    </view>
  </view>
</template>

<script setup lang="ts">
import { onLoad } from '@dcloudio/uni-app';
import { OrderApi, ProductApi } from '@/api';
import { toast } from '@/utils/uni-helpers';

const order = ref<OrderApi.Order | null>(null);
const product = ref<ProductApi.Product | null>(null);

const statusText = computed(() => {
  if (!order.value)
    return '';
  const map: Record<string, string> = {
    pending_contract: '待签约',
    pending_fulfillment: '待履约',
    in_progress: '履约中',
    completed: '已完成',
    cancelled: '已取消',
  };
  return map[order.value.status] || '待签约';
});

/** 金额可能为后端 decimal 字符串 */
function formatAmount(val: number | string | null | undefined): string {
  const n = Number(val);
  return Number.isNaN(n) ? '0' : n.toFixed(0);
}

/** 订单时间：支持 createtime（Unix 秒）或 createdAt（ISO 字符串） */
function formatOrderTime(o: OrderApi.Order) {
  if (o.createtime != null) {
    const d = new Date(o.createtime * 1000);
    return formatDatePart(d);
  }
  if (o.createdAt)
    return formatDatePart(new Date(o.createdAt));
  return '';
}

function formatDatePart(d: Date) {
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  const hh = String(d.getHours()).padStart(2, '0');
  const mm = String(d.getMinutes()).padStart(2, '0');
  return `${y}-${m}-${day} ${hh}:${mm}`;
}

async function fetchData(id: number) {
  try {
    const o = await OrderApi.getOrder(id);
    order.value = o;
    const p = await ProductApi.getProduct(o.productId);
    product.value = p;
  }
  catch {
    toast('加载订单详情失败');
  }
}

onLoad((options: any) => {
  const id = Number(options?.id);
  if (!id) {
    toast('缺少订单ID');
    return;
  }
  fetchData(id);
});
</script>

<style scoped lang="scss">
.page {
  @apply min-h-screen px-40rpx pt-40rpx pb-40rpx;
  background: #f7f8fa;
}

.card {
  @apply mb-24rpx px-32rpx pt-24rpx pb-24rpx rounded-24rpx;
  background: #ffffff;
  box-shadow: 0 10rpx 30rpx rgba(0, 0, 0, 0.04);
}

.card-header {
  @apply mb-24rpx;
}

.header-top {
  @apply flex justify-between items-center mb-8rpx;
}

.header-title {
  @apply text-30rpx font-600;
  color: #1b233b;
}

.header-status {
  @apply text-24rpx;
}

.status-pending_contract {
  color: #0A7AFF;
}

.status-pending_fulfillment,
.status-in_progress {
  color: #ff9500;
}

.status-completed {
  color: #34C759;
}

.status-cancelled {
  color: #8e8e93;
}

.header-meta {
  @apply mt-4rpx;
}

.meta-row {
  @apply flex;
  margin-top: 4rpx;
}

.meta-label {
  @apply text-24rpx;
  color: $u-tips-color;
}

.meta-value {
  @apply text-24rpx;
  color: #1b233b;
}

.section-title {
  @apply mb-12rpx text-28rpx font-500;
  color: #1b233b;
}

.content-row {
  @apply mt-4rpx flex justify-between items-center;
}

.content-name {
  @apply text-26rpx;
  color: #1b233b;
}

.content-amount {
  @apply text-28rpx font-600;
  color: #ff4d4f;
}

.detail-text {
  @apply mt-4rpx text-26rpx leading-40rpx;
  color: $u-tips-color;
}

.info-row {
  @apply mt-8rpx flex justify-between;
}

.info-label {
  @apply text-26rpx;
  color: $u-tips-color;
}

.info-value {
  @apply text-26rpx;
  color: #1b233b;
}

.contract-actions {
  @apply mt-8rpx flex justify-end gap-16rpx;
}

.contract-btn {
  @apply px-32rpx py-12rpx rounded-full text-26rpx border;
}

.contract-btn.primary {
  color: #ffffff;
  background-color: #0A7AFF;
  border-color: #0A7AFF;
}

.contract-btn.secondary {
  color: #0A7AFF;
  background-color: #ffffff;
  border-color: rgba(10, 122, 255, 0.4);
}

.loading {
  @apply flex items-center justify-center;
}
</style>

