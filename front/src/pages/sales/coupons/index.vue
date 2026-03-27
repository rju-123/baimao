<template>
  <view class="page">
    <view class="tabs">
      <view
        v-for="t in tabs"
        :key="t.key"
        class="tab"
        :class="{ active: activeTab === t.key }"
        @tap="activeTab = t.key"
      >
        {{ t.label }}
      </view>
    </view>

    <scroll-view v-if="loading" class="list" scroll-y>
      <view class="empty">加载中...</view>
    </scroll-view>
    <scroll-view v-else-if="filteredList.length === 0" class="list" scroll-y>
      <view class="empty">{{ emptyText }}</view>
    </scroll-view>
    <scroll-view v-else class="list" scroll-y>
      <view
        v-for="item in filteredList"
        :key="item.id"
        class="coupon-card"
        :class="{
          disabled: isSelectMode && !isCouponUsable(item),
          selected: isSelectMode && selectedId === item.id,
        }"
        @tap="onCouponTap(item)"
      >
        <view class="card-left">
          <text v-if="item.type === 'discount'" class="amount-text">
            {{ formatDiscount(item.value) }}
          </text>
          <text v-else class="amount-text">¥{{ Math.round(item.value) }}</text>
        </view>
        <view class="card-right">
          <view class="name">{{ item.name }}</view>
          <view class="limit">
            {{ item.minAmount > 0 ? `满¥${Math.round(item.minAmount)}可用` : '无门槛' }}
          </view>
          <view class="valid">
            {{ formatDate(item.validFrom) }} 至 {{ formatDate(item.validTo) }}
          </view>
          <view class="scope">全场通用</view>
        </view>
        <view class="card-tag">
          <text v-if="item.status === 'available'" class="tag-btn">
            {{ isSelectMode ? '选择' : '立即使用' }}
          </text>
          <text v-else-if="item.status === 'used'" class="tag-gray">已使用</text>
          <text v-else class="tag-gray">已过期</text>
        </view>
      </view>
    </scroll-view>

    <view v-if="isSelectMode" class="footer">
      <button class="no-coupon-btn" @tap="selectNone">不使用优惠券</button>
    </view>
  </view>
</template>

<script setup lang="ts">
import { onLoad, onShow } from '@dcloudio/uni-app';
import { computed, ref, watch } from 'vue';
import type { Coupon } from '@/api/coupon';
import { get } from '@/utils/request';
import useUserStore from '@/store/modules/user';

const COUPON_SELECTION_RESULT = 'coupon_selection_result';

const userStore = useUserStore();
const loading = ref(false);
const list = ref<Coupon[]>([]);
const activeTab = ref<'available' | 'used' | 'expired'>('available');
const selectedId = ref<number | null>(null);

const from = ref<'purchase' | 'cart' | 'cart_confirm' | ''>('');
const productId = ref<number | null>(null);
const amount = ref(0);
const itemIndex = ref<number | null>(null);

const tabs = [
  { key: 'available' as const, label: '可使用' },
  { key: 'used' as const, label: '已使用' },
  { key: 'expired' as const, label: '已过期' },
];

const isSelectMode = computed(() => !!from.value);

const filteredList = computed(() => {
  const statusMap = {
    available: 'available',
    used: 'used',
    expired: 'expired',
  };
  const target = statusMap[activeTab.value];
  return list.value.filter(i => i.status === target);
});

const emptyText = computed(() => {
  const map = { available: '暂无可用优惠券', used: '暂无已使用记录', expired: '暂无已过期优惠券' };
  return map[activeTab.value];
});

function formatDiscount(v: number) {
  const pct = Math.round(v * 10);
  return `${pct}折`;
}

function formatDate(s: string) {
  if (!s) return '';
  const d = new Date(s);
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
}

function isCouponUsable(item: Coupon) {
  if (item.status !== 'available') return false;
  return amount.value >= (item.minAmount || 0);
}

async function fetchList() {
  await userStore.refreshUserInfo?.();
  const userId = Number(userStore.user_id || 0);
  if (!userId) {
    list.value = [];
    loading.value = false;
    return;
  }
  loading.value = true;
  try {
    // 与下单页使用相同的 get() 直接请求，确保数据一致
    const data = await get<Coupon[]>(`/coupons?userId=${encodeURIComponent(String(userId))}&status=${activeTab.value}`);
    list.value = Array.isArray(data) ? data : [];
  }
  catch (e) {
    console.warn('load coupons failed', e);
    list.value = [];
  }
  finally {
    loading.value = false;
  }
}

// 切换 tab 时重新拉取对应状态的优惠券
watch(activeTab, () => {
  fetchList();
});

function onCouponTap(item: Coupon) {
  if (item.status !== 'available') return;
  if (isSelectMode.value) {
    if (!isCouponUsable(item)) return;
    selectedId.value = item.id;
    applyAndBack(item);
  }
  else {
    uni.switchTab({ url: '/pages/sales/order/index' });
  }
}

function applyAndBack(coupon: Coupon) {
  const payload: Record<string, any> = {
    from: from.value,
    couponId: coupon.id,
    couponName: coupon.name,
    couponValue: coupon.value,
    couponType: coupon.type,
    couponMinAmount: coupon.minAmount || 0,
  };
  if (from.value === 'purchase' && productId.value != null) {
    payload.productId = productId.value;
  }
  if ((from.value === 'cart' || from.value === 'cart_confirm') && itemIndex.value != null) {
    payload.itemIndex = itemIndex.value;
  }
  uni.setStorageSync(COUPON_SELECTION_RESULT, JSON.stringify(payload));
  uni.navigateBack();
}

function selectNone() {
  const payload: Record<string, any> = {
    from: from.value,
    couponId: null,
    couponName: '',
    couponValue: 0,
    couponType: '',
    couponMinAmount: 0,
  };
  if (from.value === 'purchase' && productId.value != null) {
    payload.productId = productId.value;
  }
  if ((from.value === 'cart' || from.value === 'cart_confirm') && itemIndex.value != null) {
    payload.itemIndex = itemIndex.value;
  }
  uni.setStorageSync(COUPON_SELECTION_RESULT, JSON.stringify(payload));
  uni.navigateBack();
}

onLoad((options: any) => {
  from.value = options?.from || '';
  productId.value = options?.productId != null ? Number(options.productId) : null;
  amount.value = options?.amount != null ? Number(options.amount) : 0;
  itemIndex.value = options?.itemIndex != null ? Number(options.itemIndex) : null;
  fetchList();
});

onShow(() => {
  // 每次显示时刷新，确保显示后台分配的优惠券
  fetchList();
});
</script>

<style scoped lang="scss">
.page {
  min-height: 100vh;
  padding-bottom: 120rpx;
  box-sizing: border-box;
  background-color: #f5f5f5;
}

.tabs {
  display: flex;
  background-color: #fff;
  padding: 0 24rpx;
}

.tab {
  flex: 1;
  padding: 28rpx 0;
  text-align: center;
  font-size: 28rpx;
  color: var(--theme-text-subtitle);
}

.tab.active {
  color: #007AFF;
  font-weight: 600;
  border-bottom: 4rpx solid #007AFF;
}

.list {
  height: calc(100vh - 100rpx);
  padding: 24rpx;
}

.empty {
  padding: 80rpx 0;
  text-align: center;
  font-size: 28rpx;
  color: var(--theme-text-subtitle);
}

.coupon-card {
  display: flex;
  align-items: stretch;
  background: linear-gradient(135deg, #fff5f5 0%, #fff 50%);
  border-radius: 16rpx;
  margin-bottom: 24rpx;
  overflow: hidden;
  border: 1rpx solid #f0f0f0;
}

.coupon-card.disabled {
  opacity: 0.6;
}

.coupon-card.selected {
  border-color: #007AFF;
  box-shadow: 0 0 0 2rpx rgba(0, 122, 255, 0.3);
}

.card-left {
  width: 180rpx;
  display: flex;
  align-items: center;
  justify-content: center;
  background: linear-gradient(135deg, #ff6b6b 0%, #ee5a5a 100%);
}

.amount-text {
  font-size: 40rpx;
  font-weight: 700;
  color: #fff;
}

.card-right {
  flex: 1;
  padding: 24rpx 20rpx;
}

.name {
  font-size: 30rpx;
  font-weight: 600;
  color: var(--theme-text-title);
  margin-bottom: 8rpx;
}

.limit, .valid, .scope {
  font-size: 24rpx;
  color: var(--theme-text-subtitle);
  margin-bottom: 4rpx;
}

.card-tag {
  padding: 24rpx 20rpx;
  display: flex;
  align-items: center;
}

.tag-btn {
  font-size: 24rpx;
  color: #007AFF;
  padding: 8rpx 20rpx;
  border: 1rpx solid #007AFF;
  border-radius: 8rpx;
}

.tag-gray {
  font-size: 24rpx;
  color: #9ca3af;
}

.footer {
  position: fixed;
  left: 0;
  right: 0;
  bottom: 0;
  padding: 24rpx 32rpx;
  padding-bottom: calc(24rpx + env(safe-area-inset-bottom, 0px));
  background-color: #fff;
  box-shadow: 0 -4rpx 20rpx rgba(0, 0, 0, 0.05);
}

.no-coupon-btn {
  width: 100%;
  padding: 24rpx 0;
  font-size: 28rpx;
  color: var(--theme-text-subtitle);
  background-color: #f3f4f6;
  border: none;
  border-radius: var(--theme-btn-radius);
}
</style>
