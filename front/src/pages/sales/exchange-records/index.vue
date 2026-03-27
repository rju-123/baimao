<template>
  <view class="page">
    <view v-if="loading" class="empty">
      加载中...
    </view>
    <view v-else-if="records.length === 0" class="empty">
      暂无兑换记录
    </view>
    <scroll-view
      v-else
      class="list"
      scroll-y
    >
      <view
        v-for="item in records"
        :key="item.id"
        class="record-card"
        @click="goDetail(item.id)"
      >
        <view class="record-main">
          <view class="name-row">
            <text class="name">
              {{ itemName(item) }}
            </text>
            <text class="status" :class="statusClass(item)">
              {{ statusText(item) }}
            </text>
          </view>
          <view class="meta-row">
            <text class="kind">
              {{ item.kind === 'physical' ? '实体' : '虚拟' }}
            </text>
            <text class="points">
              -{{ item.pointsSpent }} 积分
            </text>
          </view>
        </view>
        <view class="time-row">
          {{ item.createdAt }}
        </view>
      </view>
    </scroll-view>
  </view>
</template>

<script setup lang="ts">
import { onShow } from '@dcloudio/uni-app';
import { ref } from 'vue';
import { PointsApi } from '@/api';
import type { ExchangeRecord } from '@/api/points';
import useUserStore from '@/store/modules/user';

const userStore = useUserStore();
const loading = ref(false);
const records = ref<ExchangeRecord[]>([]);

const fetchRecords = async () => {
  const userId = Number(userStore.user_id || 0);
  if (!userId) {
    records.value = [];
    return;
  }
  loading.value = true;
  try {
    const data = await PointsApi.listExchangeRecords(userId);
    records.value = Array.isArray(data) ? data : [];
  }
  catch (err) {
    console.error('load exchange records error', err);
    records.value = [];
    uni.showToast({ title: '加载兑换记录失败', icon: 'none' });
  }
  finally {
    loading.value = false;
  }
};

const itemName = (item: ExchangeRecord) => {
  // 后端暂未提供商品名称快照，这里只返回 ID 占位，可在后续扩展为 join 商品表
  return `商品 #${item.itemId}`;
};

const statusText = (item: ExchangeRecord) => {
  if (item.kind === 'virtual')
    return '已完成';
  switch (item.status) {
    case 'pending_shipment':
      return '待发货';
    case 'shipped':
      return '已发货';
    case 'received':
      return '已签收';
    default:
      return '已完成';
  }
};

const statusClass = (item: ExchangeRecord) => {
  if (item.kind === 'virtual')
    return 'status-completed';
  switch (item.status) {
    case 'pending_shipment':
      return 'status-pending';
    case 'shipped':
      return 'status-shipped';
    case 'received':
      return 'status-received';
    default:
      return 'status-completed';
  }
};

const goDetail = (id: number) => {
  uni.navigateTo({
    url: `/pages/sales/exchange-records/detail?id=${id}`,
  });
};

onShow(() => {
  fetchRecords();
});
</script>

<style scoped lang="scss">
.page {
  min-height: 100vh;
  padding: 32rpx;
  box-sizing: border-box;
  background: linear-gradient(180deg, var(--theme-bg-gradient-start) 0%, var(--theme-bg-gradient-end) 100%);
}

.list {
  height: calc(100vh - 48rpx);
}

.record-card {
  background-color: #ffffff;
  border-radius: var(--theme-card-radius);
  padding: 24rpx 28rpx;
  margin-bottom: 20rpx;
  box-shadow: var(--theme-card-shadow);
}

.record-main {
  margin-bottom: 8rpx;
}

.name-row {
  display: flex;
  justify-content: space-between;
  align-items: center;
}

.name {
  font-size: 28rpx;
  font-weight: 500;
  color: #000000;
}

.status {
  font-size: 22rpx;
  padding: 2rpx 12rpx;
  border-radius: 999rpx;
  color: #ffffff;
}

.status-pending {
  background-color: #ff9500;
}

.status-shipped {
  background-color: #007AFF;
}

.status-received,
.status-completed {
  background-color: #34c759;
}

.meta-row {
  margin-top: 8rpx;
  display: flex;
  justify-content: space-between;
  font-size: 24rpx;
}

.kind {
  color: #8e8e93;
}

.points {
  color: #ff3b30;
}

.time-row {
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

