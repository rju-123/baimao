<template>
  <view class="page">
    <view v-if="!record && !loading" class="empty">
      记录不存在或已删除
    </view>

    <view v-else>
      <!-- 状态展示 -->
      <view class="card status-card">
        <view class="status-title">
          {{ statusText }}
        </view>
        <view class="status-desc">
          {{ statusDesc }}
        </view>
      </view>

      <!-- 兑换信息 -->
      <view class="card">
        <view class="section-header">
          兑换信息
        </view>
        <view class="row">
          <text class="label">
            兑换 ID
          </text>
          <text class="value">
            {{ record?.id }}
          </text>
        </view>
        <view class="row">
          <text class="label">
            商品
          </text>
          <text class="value">
            {{ recordItemName }}
          </text>
        </view>
        <view class="row">
          <text class="label">
            类型
          </text>
          <text class="value">
            {{ record?.kind === 'physical' ? '实体商品' : '虚拟商品' }}
          </text>
        </view>
        <view class="row">
          <text class="label">
            数量
          </text>
          <text class="value">
            {{ record?.quantity }}
          </text>
        </view>
        <view class="row">
          <text class="label">
            消耗积分
          </text>
          <text class="value negative">
            -{{ record?.pointsSpent }} 积分
          </text>
        </view>
        <view class="row">
          <text class="label">
            兑换时间
          </text>
          <text class="value">
            {{ formatExchangeDate(record?.createdAt) }}
          </text>
        </view>
      </view>

      <!-- 地址信息（实体商品） -->
      <view v-if="record?.kind === 'physical' && record.addressSnapshot" class="card">
        <view class="section-header">
          收货地址
        </view>
        <view class="long-text">
          {{ record.addressSnapshot }}
        </view>
        <view v-if="record?.code" class="express-row">
          <text class="label">快递单号</text>
          <text class="value">{{ record.code }}</text>
        </view>
      </view>

      <!-- 券码信息（虚拟商品） -->
      <view v-if="record?.kind === 'virtual'" class="card">
        <view class="section-header">
          兑换码
        </view>
        <view class="code-row">
          <text class="code-value">
            {{ record?.code || '暂未生成' }}
          </text>
          <text v-if="record?.code" class="copy-icon" @tap.stop="copyCode">复制</text>
        </view>
        <view class="code-tip">
          点击右侧复制可复制到剪贴板
        </view>
      </view>
    </view>
  </view>
</template>

<script setup lang="ts">
import { computed, ref } from 'vue';
import { onLoad } from '@dcloudio/uni-app';
import { PointsApi } from '@/api';
import type { ExchangeRecord } from '@/api/points';

const loading = ref(false);
const record = ref<ExchangeRecord | null>(null);

const recordItemName = computed(() => {
  const r = record.value;
  if (!r)
    return '';
  const n = String((r as any)?.itemName ?? '').trim();
  return n || `商品 #${r.itemId}`;
});

function formatExchangeDate(raw: any): string {
  if (!raw)
    return '—';
  const d = raw instanceof Date ? raw : new Date(String(raw));
  if (Number.isNaN(d.getTime()))
    return '—';
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  return `${y}.${m}.${day}`;
}

const loadRecord = async (id: number) => {
  loading.value = true;
  try {
    const data = await PointsApi.getExchangeRecord(id);
    record.value = data || null;
  }
  catch (err) {
    console.error('load record error', err);
    record.value = null;
    uni.showToast({ title: '加载兑换详情失败', icon: 'none' });
  }
  finally {
    loading.value = false;
  }
};

const statusText = computed(() => {
  if (!record.value)
    return '';
  if (record.value.kind === 'virtual')
    return '已完成';
  switch (record.value.status) {
    case 'pending_shipment':
      return '待发货';
    case 'shipped':
      return '已发货';
    case 'received':
      return '已签收';
    default:
      return '已完成';
  }
});

const statusDesc = computed(() => {
  if (!record.value)
    return '';
  if (record.value.kind === 'virtual')
    return '虚拟商品已发放兑换码，可直接使用';
  switch (record.value.status) {
    case 'pending_shipment':
      return '商家将尽快为您发货';
    case 'shipped':
      return '商品已发货，请留意物流信息';
    case 'received':
      return '商品已签收，如有问题请联系管理员';
    default:
      return '兑换已完成';
  }
});

const copyCode = () => {
  if (!record.value?.code)
    return;
  uni.setClipboardData({
    data: record.value.code,
    success: () => {
      uni.showToast({ title: '已复制到剪贴板', icon: 'none' });
    },
  });
};

onLoad((options: Record<string, any>) => {
  const id = Number(options.id || 0);
  if (!id) {
    uni.showToast({ title: '缺少记录ID', icon: 'none' });
    return;
  }
  loadRecord(id);
});
</script>

<style scoped lang="scss">
.page {
  min-height: 100vh;
  padding: 32rpx;
  box-sizing: border-box;
  background: linear-gradient(180deg, var(--theme-bg-gradient-start) 0%, var(--theme-bg-gradient-end) 100%);
}

.card {
  background-color: #ffffff;
  border-radius: var(--theme-card-radius);
  padding: 28rpx 32rpx;
  margin-bottom: 20rpx;
  box-shadow: var(--theme-card-shadow);
}

.status-card {
  text-align: left;
}

.status-title {
  font-size: 30rpx;
  font-weight: 600;
  margin-bottom: 8rpx;
}

.status-desc {
  font-size: 24rpx;
  color: #8e8e93;
}

.section-header {
  font-size: 26rpx;
  font-weight: 500;
  margin-bottom: 16rpx;
}

.row {
  display: flex;
  justify-content: space-between;
  font-size: 24rpx;
  margin-bottom: 8rpx;
}

.label {
  color: #8e8e93;
}

.value {
  color: #000000;
}

.value.negative {
  color: #ff3b30;
}

.long-text {
  font-size: 24rpx;
  color: #000000;
  line-height: 1.6;
}

.express-row {
  display: flex;
  justify-content: space-between;
  align-items: center;
  font-size: 24rpx;
  margin-top: 16rpx;
  padding-top: 16rpx;
  border-top: 1rpx solid #f0f0f0;
}

.express-row .label {
  color: #8e8e93;
}

.express-row .value {
  color: #000000;
  font-weight: 500;
}

.code-row {
  padding: 12rpx;
  border-radius: 8rpx;
  background-color: #f5f5f5;
  display: flex;
  align-items: center;
  justify-content: space-between;
}

.code-value {
  font-size: 26rpx;
  flex: 1;
  text-align: center;
  margin-right: 16rpx;
  word-break: break-all;
}

.copy-icon {
  flex-shrink: 0;
  font-size: 24rpx;
  padding: 6rpx 16rpx;
  border-radius: 8rpx;
  border: 1rpx solid #007AFF;
  color: #007AFF;
  background-color: #ffffff;
}

.code-tip {
  margin-top: 8rpx;
  font-size: 22rpx;
  color: #8e8e93;
}

.empty {
  padding: 80rpx 0;
  text-align: center;
  color: #8e8e93;
  font-size: 26rpx;
}
</style>

