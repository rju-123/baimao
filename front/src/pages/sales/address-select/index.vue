<template>
  <view class="page">
    <view class="header">
      <text class="title">选择收货地址</text>
    </view>

    <scroll-view class="list" scroll-y>
      <view v-if="loading" class="empty">
        加载中...
      </view>
      <view v-else-if="addresses.length === 0" class="empty">
        暂无收货地址，请先添加
      </view>
      <view
        v-else
        v-for="addr in addresses"
        :key="addr.id"
        class="addr-card"
        :class="{ active: addr.id === selectedId }"
        @click="handleSelect(addr)"
      >
        <view class="addr-row">
          <text class="name">
            {{ addr.receiverName }}
          </text>
          <text class="phone">
            {{ addr.receiverPhone }}
          </text>
          <text v-if="addr.isDefault" class="tag-default">
            默认
          </text>
        </view>
        <view class="addr-detail">
          {{ addr.region }} {{ addr.detail }}
        </view>
      </view>
    </scroll-view>

    <view class="footer">
      <button class="add-btn" @click="goAdd">
        + 添加新地址
      </button>
    </view>
  </view>
</template>

<script setup lang="ts">
import { onLoad, onShow } from '@dcloudio/uni-app';
import { ref } from 'vue';
import { AddressesApi } from '@/api';
import type { AddressItem } from '@/api/addresses';
import useUserStore from '@/store/modules/user';

const userStore = useUserStore();

const loading = ref(false);
const addresses = ref<AddressItem[]>([]);
const selectedId = ref<number | null>(null);
let openerChannel: UniApp.EventChannel | null = null;

const fetchList = async () => {
  const userId = Number(userStore.user_id || 0);
  if (!userId) {
    addresses.value = [];
    return;
  }
  loading.value = true;
  try {
    const list = await AddressesApi.listAddresses(userId);
    addresses.value = Array.isArray(list) ? list : [];
    if (!selectedId.value) {
      const def = addresses.value.find(a => a.isDefault);
      if (def)
        selectedId.value = def.id;
    }
  }
  catch (e) {
    console.error('load addresses error', e);
    uni.showToast({ title: '加载收货地址失败', icon: 'none' });
    addresses.value = [];
  }
  finally {
    loading.value = false;
  }
};

const handleSelect = (addr: AddressItem) => {
  selectedId.value = addr.id;
  // 通过本地存储把选择结果带回上一页，避免 eventChannel 兼容性问题
  try {
    uni.setStorageSync('sales_selected_address', addr);
  }
  catch (e) {
    console.warn('setStorage address failed', e);
  }
  if (openerChannel) {
    openerChannel.emit('addressSelected', addr);
  }
  uni.navigateBack();
};

const goAdd = () => {
  uni.navigateTo({
    url: '/pages/sales/address-edit/index',
  });
};

onLoad((options: Record<string, any>) => {
  const currentId = Number(options.selectedId || 0);
  if (currentId)
    selectedId.value = currentId;
  // 记录打开方的 eventChannel，便于回传选择结果
  // #ifdef MP-WEIXIN
  // eslint-disable-next-line @typescript-eslint/ban-ts-comment
  // @ts-ignore
  openerChannel = getOpenerEventChannel ? getOpenerEventChannel() : null;
  // #endif
});

onShow(() => {
  fetchList();
});
</script>

<style scoped lang="scss">
.page {
  min-height: 100vh;
  display: flex;
  flex-direction: column;
  background: linear-gradient(180deg, var(--theme-bg-gradient-start) 0%, var(--theme-bg-gradient-end) 100%);
}

.header {
  padding: 32rpx 40rpx;
}

.title {
  font-size: 32rpx;
  font-weight: 600;
  color: var(--theme-text-title);
}

.list {
  flex: 1;
  padding: 0 32rpx 32rpx;
  box-sizing: border-box;
}

.addr-card {
  background-color: #ffffff;
  border-radius: var(--theme-card-radius);
  padding: 28rpx 32rpx;
  margin-bottom: 20rpx;
  box-shadow: var(--theme-card-shadow);
}

.addr-card.active {
  border: 2rpx solid #007AFF;
}

.addr-row {
  display: flex;
  align-items: center;
  margin-bottom: 8rpx;
}

.name {
  font-size: 30rpx;
  font-weight: 600;
  margin-right: 20rpx;
  color: var(--theme-text-title);
}

.phone {
  font-size: 26rpx;
  color: var(--theme-text-subtitle);
}

.tag-default {
  margin-left: auto;
  padding: 6rpx 14rpx;
  border-radius: 20rpx;
  font-size: 22rpx;
  color: #007AFF;
  background-color: rgba(0, 122, 255, 0.1);
}

.addr-detail {
  font-size: 24rpx;
  color: var(--theme-text-subtitle);
}

.empty {
  padding: 80rpx 0;
  text-align: center;
  color: var(--theme-text-subtitle);
  font-size: 26rpx;
}

.footer {
  padding: 20rpx 32rpx env(safe-area-inset-bottom);
  box-sizing: border-box;
  background-color: rgba(255, 255, 255, 0.98);
  box-shadow: 0 -10rpx 30rpx rgba(0, 122, 255, 0.06);
}

.add-btn {
  width: 100%;
  height: 88rpx;
  line-height: 88rpx;
  text-align: center;
  border-radius: var(--theme-btn-radius);
  border: 1px solid #E0E0E0;
  background-color: #ffffff;
  color: #007AFF;
  font-size: 28rpx;
}
</style>

