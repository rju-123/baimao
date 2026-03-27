<template>
  <view class="page">
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
        @tap="setDefault(addr)"
      >
        <view class="addr-row">
          <text class="name">{{ addr.receiverName }}</text>
          <text class="phone">{{ addr.receiverPhone }}</text>
          <text v-if="addr.isDefault" class="tag-default">默认</text>
        </view>
        <view class="addr-detail">{{ addr.region }} {{ addr.detail }}</view>
        <view class="addr-actions">
          <text class="action-btn" @tap.stop="editAddr(addr)">编辑</text>
          <text class="action-btn danger" @tap.stop="deleteAddr(addr)">删除</text>
        </view>
      </view>
    </scroll-view>

    <view class="footer">
      <button class="add-btn" @tap="goAdd">
        + 添加新地址
      </button>
    </view>
  </view>
</template>

<script setup lang="ts">
import { onShow } from '@dcloudio/uni-app';
import { ref } from 'vue';
import { AddressesApi } from '@/api';
import type { AddressItem } from '@/api/addresses';
import useUserStore from '@/store/modules/user';

const userStore = useUserStore();

const loading = ref(false);
const addresses = ref<AddressItem[]>([]);

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

const setDefault = async (addr: AddressItem) => {
  if (addr.isDefault)
    return;
  try {
    await AddressesApi.updateAddress(addr.id, {
      receiverName: addr.receiverName,
      receiverPhone: addr.receiverPhone,
      region: addr.region,
      detail: addr.detail,
      isDefault: true,
    });
    uni.showToast({ title: '已设为默认地址', icon: 'success' });
    await fetchList();
  }
  catch (e) {
    console.error('set default error', e);
    uni.showToast({ title: '设置失败', icon: 'none' });
  }
};

const editAddr = (addr: AddressItem) => {
  try {
    uni.setStorageSync('sales_edit_address', addr);
  }
  catch (e) {
    console.warn('setStorage edit address failed', e);
  }
  uni.navigateTo({
    url: `/pages/sales/address-edit/index?id=${addr.id}`,
  });
};

const deleteAddr = (addr: AddressItem) => {
  uni.showModal({
    title: '确认删除',
    content: `确定要删除收货地址「${addr.receiverName} ${addr.receiverPhone}」吗？`,
    success: async (res) => {
      if (!res.confirm)
        return;
      try {
        await AddressesApi.deleteAddress(addr.id);
        uni.showToast({ title: '已删除', icon: 'success' });
        await fetchList();
      }
      catch (e) {
        console.error('delete error', e);
        uni.showToast({ title: '删除失败', icon: 'none' });
      }
    },
  });
};

const goAdd = () => {
  uni.navigateTo({
    url: '/pages/sales/address-edit/index',
  });
};

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

.list {
  flex: 1;
  padding: 32rpx;
  box-sizing: border-box;
}

.addr-card {
  background-color: #ffffff;
  border-radius: var(--theme-card-radius);
  padding: 28rpx 32rpx;
  margin-bottom: 20rpx;
  box-shadow: var(--theme-card-shadow);
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
  margin-bottom: 16rpx;
}

.addr-actions {
  display: flex;
  gap: 32rpx;
  padding-top: 12rpx;
  border-top: 1rpx solid #f3f4f6;
}

.action-btn {
  font-size: 26rpx;
  color: #007AFF;
}

.action-btn.danger {
  color: #FF3B30;
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
