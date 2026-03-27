<template>
  <view class="page">
    <!-- 顶部状态 Tabs -->
    <view class="tabs">
      <view
        v-for="tab in tabs"
        :key="tab.key"
        :class="['tab-item', activeTab === tab.key ? 'tab-item-active' : '']"
        @tap="changeTab(tab.key)"
      >
        {{ tab.label }}
      </view>
    </view>

    <!-- 订单列表 -->
    <scroll-view scroll-y class="list">
      <view
        v-for="item in displayedOrders"
        :key="item.id"
        class="order-card"
        @tap="handleCardTap(item)"
      >
        <view class="order-header">
          <text class="order-no">{{ item.orderNo }}</text>
          <text class="order-status" :class="`status-${item.status}`">
            {{ statusText(item.status) }}
          </text>
        </view>
        <view class="order-name">
          {{ item.productName }}
        </view>
        <view class="order-customer" v-if="orderCustomerDisplay(item)">
          客户：{{ orderCustomerDisplay(item) }}
        </view>
        <view class="order-footer">
          <text class="order-amount">￥{{ formatAmount(item.payAmount) }}</text>
          <text class="order-time">{{ formatOrderTime(item) }}</text>
        </view>
      </view>

      <view v-if="!loading && displayedOrders.length === 0" class="empty">
        暂无订单
      </view>
    </scroll-view>
  </view>
</template>

<script setup lang="ts">
import { onLoad, onShow } from '@dcloudio/uni-app';
import { OrderApi as OrderApiNs } from '@/api';
import type { Order } from '@/api/order';
import useUserStore from '@/store/modules/user';
import { route, toast } from '@/utils/uni-helpers';

const userStore = useUserStore();

const tabs = [
  { key: 'all', label: '全部' },
  { key: 'signing', label: '签署中' },
  { key: 'pending_fulfillment', label: '履约中' },
  { key: 'completed', label: '已完成' },
  { key: 'cancelled', label: '已取消' },
] as const;

type TabKey = (typeof tabs)[number]['key'];

const activeTab = ref<TabKey>('all');
const orders = ref<Order[]>([]);
const loading = ref(false);

const displayedOrders = computed(() => {
  if (activeTab.value === 'all')
    return orders.value;
  return orders.value.filter(item => item.status === activeTab.value);
});

function statusText(status: string) {
  const map: Record<string, string> = {
    signing: '签署中',
    pending_contract: '签约中',
    pending_fulfillment: '履约中',
    in_progress: '履约中',
    completed: '已完成',
    cancelled: '已取消',
  };
  return map[status] || '签署中';
}

/** 订单“客户”展示：仅展示后台产品信息中的客户信息（product_customer），与后台管理一致 */
function orderCustomerDisplay(order: Order): string {
  const s = (order.productCustomer ?? (order as any).product_customer ?? '').trim();
  return s;
}

/** 金额可能为后端 decimal 字符串，统一格式化为整数展示 */
function formatAmount(val: number | string | null | undefined): string {
  const n = Number(val);
  return Number.isNaN(n) ? '0' : n.toFixed(0);
}

/** 订单时间：支持 createtime（Unix 秒）或 createdAt（ISO 字符串） */
function formatOrderTime(order: Order) {
  if (order.createtime != null) {
    const d = new Date(order.createtime * 1000);
    return formatDatePart(d);
  }
  if (order.createdAt)
    return formatDatePart(new Date(order.createdAt));
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

function changeTab(key: TabKey) {
  activeTab.value = key;
  fetchOrders();
}

async function fetchOrders() {
  const userId = Number(userStore.user_id);
  if (!userId) {
    toast('请先登录');
    return;
  }
  loading.value = true;
  try {
    const params: OrderApiNs.ListOrdersParams = {
      userId,
    };
    if (activeTab.value !== 'all')
      params.status = activeTab.value;

    const data = await OrderApiNs.listOrders(params);
    orders.value = Array.isArray(data) ? data : [];
  }
  catch (err) {
    // 请求失败时仅提示错误，不再展示示例数据，避免误导为真实订单
    console.error('fetchOrders error', err);
    toast('加载订单失败，请稍后重试');
    orders.value = [];
  }
  finally {
    loading.value = false;
  }
}

function handleCardTap(item: Order) {
  route({
    type: 'navigateTo',
    url: `/pages/sales/order-detail/index?id=${item.id}`,
  });
}

onLoad(() => {
  // 订单在 onShow 中拉取，避免与 onShow 重复请求
});

onShow(() => {
  // 每次显示页面（含首次进入、从登录/其他页返回）都拉取订单，确保能拿到数据
  fetchOrders();
});
</script>

<style scoped lang="scss">
.page {
  min-height: 100vh;
  padding: 32rpx 32rpx 40rpx;
  box-sizing: border-box;
  background: linear-gradient(180deg, var(--theme-bg-gradient-start) 0%, var(--theme-bg-gradient-end) 100%);
}

.tabs {
  display: flex;
  align-items: center;
  padding: 8rpx;
  border-radius: 24rpx;
  background-color: #ffffff;
  margin-bottom: 32rpx;
  box-shadow: var(--theme-card-shadow);
}

.tab-item {
  flex: 1;
  text-align: center;
  padding: 16rpx 0;
  font-size: 26rpx;
  color: var(--theme-text-subtitle);
  border-radius: 20rpx;
}

.tab-item-active {
  background-color: #007AFF;
  color: #ffffff;
  font-weight: 600;
}

.list {
  height: calc(100vh - 140rpx);
}

.order-card {
  padding: 28rpx 32rpx;
  margin-bottom: 24rpx;
  border-radius: var(--theme-card-radius);
  background-color: #ffffff;
  box-shadow: var(--theme-card-shadow);
}

.order-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 8rpx;
}

.order-no {
  font-size: 24rpx;
  color: var(--theme-text-subtitle);
}

.order-status {
  font-size: 24rpx;
}

.status-pending_contract {
  color: #007AFF;
}

.status-signing {
  color: #007AFF;
}

.status-pending_fulfillment,
.status-in_progress {
  color: #ff9500;
}

.status-completed {
  color: #34C759;
}

.status-cancelled {
  color: var(--theme-text-subtitle);
}

.order-name {
  margin-bottom: 12rpx;
  font-size: 28rpx;
  font-weight: 600;
  color: var(--theme-text-title);
}

.order-customer {
  margin-bottom: 8rpx;
  font-size: 24rpx;
  color: var(--theme-text-subtitle);
}

.order-footer {
  display: flex;
  justify-content: space-between;
  align-items: center;
}

.order-amount {
  font-size: 28rpx;
  font-weight: 600;
  color: #ff3b30;
}

.order-time {
  font-size: 24rpx;
  color: var(--theme-text-subtitle);
}

.empty {
  margin-top: 40rpx;
  text-align: center;
  font-size: 26rpx;
  color: var(--theme-text-subtitle);
}
</style>

