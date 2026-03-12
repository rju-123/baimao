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
  background-color: #f5f5f7;
}

.header {
  padding: 24rpx 32rpx;
}

.title {
  font-size: 32rpx;
  font-weight: 600;
}

.list {
  flex: 1;
  padding: 0 24rpx 24rpx;
  box-sizing: border-box;
}

.addr-card {
  background-color: #ffffff;
  border-radius: 20rpx;
  padding: 24rpx 28rpx;
  margin-bottom: 16rpx;
}

.addr-card.active {
  border: 2rpx solid #0a7aff;
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
}

.phone {
  font-size: 26rpx;
  color: #333333;
}

.tag-default {
  margin-left: auto;
  padding: 4rpx 12rpx;
  border-radius: 20rpx;
  font-size: 22rpx;
  color: #0a7aff;
  background-color: rgba(10, 122, 255, 0.08);
}

.addr-detail {
  font-size: 24rpx;
  color: #8e8e93;
}

.empty {
  padding: 80rpx 0;
  text-align: center;
  color: #8e8e93;
  font-size: 26rpx;
}

.footer {
  padding: 12rpx 24rpx env(safe-area-inset-bottom);
  box-sizing: border-box;
  background-color: #ffffff;
  box-shadow: 0 -4rpx 12rpx rgba(0, 0, 0, 0.04);
}

.add-btn {
  width: 100%;
  height: 88rpx;
  line-height: 88rpx;
  text-align: center;
  border-radius: 44rpx;
  border: 2rpx solid #0a7aff;
  background-color: #ffffff;
  color: #0a7aff;
  font-size: 28rpx;
}
</style>

