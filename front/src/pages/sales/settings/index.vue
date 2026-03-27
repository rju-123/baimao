<template>
  <view class="settings-page">
    <!-- 设置项列表 -->
    <view class="settings-card">
      <!-- 1. 修改头像 -->
      <view class="setting-row" @tap="toggleAvatarPicker">
        <text class="setting-label">修改头像</text>
        <view class="setting-right">
          <view
            class="avatar-preview"
            :style="{ backgroundColor: avatarBgColor(currentPreset.color) }"
          >
            <view class="avatar-person i-mdi-account" :style="{ color: currentPreset.color }" />
          </view>
          <text class="arrow">{{ avatarPickerOpen ? '▲' : '▼' }}</text>
        </view>
      </view>

      <!-- 头像选择器（可展开/收起） -->
      <view v-if="avatarPickerOpen" class="avatar-picker">
        <view class="avatar-grid">
          <view
            v-for="(p, idx) in avatarPresets"
            :key="idx"
            class="avatar-option"
            :class="{ selected: currentPresetId === p.id }"
            @tap.stop="selectAvatar(p.id)"
          >
            <view
              class="avatar-circle"
              :style="{ backgroundColor: avatarBgColor(p.color) }"
            >
              <view class="avatar-person i-mdi-account" :style="{ color: p.color }" />
            </view>
            <text class="avatar-label">{{ p.label }}</text>
          </view>
        </view>
      </view>

      <!-- 2. 收货地址 -->
      <view class="setting-row" @tap="goAddressManagement">
        <text class="setting-label">收货地址</text>
        <view class="setting-right">
          <text class="setting-hint">管理收货地址</text>
          <text class="arrow">›</text>
        </view>
      </view>
    </view>

    <!-- 底部退出登录 -->
    <view class="logout-area">
      <button class="logout-btn" @tap="handleLogout">
        退出登录
      </button>
    </view>
  </view>
</template>

<script setup lang="ts">
import { computed, ref } from 'vue';
import { onShow } from '@dcloudio/uni-app';
import useUserStore from '@/store/modules/user';

const AVATAR_STORAGE_KEY = 'user_avatar_preset';

const avatarPresets = [
  { id: 0, color: '#007AFF', label: '蓝色' },
  { id: 1, color: '#34C759', label: '绿色' },
  { id: 2, color: '#FF9500', label: '橙色' },
  { id: 3, color: '#FF3B30', label: '红色' },
  { id: 4, color: '#AF52DE', label: '紫色' },
  { id: 5, color: '#5856D6', label: '靛蓝' },
  { id: 6, color: '#00C7BE', label: '青色' },
  { id: 7, color: '#8E8E93', label: '灰色' },
];

const userStore = useUserStore();
const avatarPickerOpen = ref(false);

function avatarBgColor(hex: string): string {
  if (hex.startsWith('#')) {
    const h = hex.slice(1);
    const r = Number.parseInt(h.slice(0, 2), 16);
    const g = Number.parseInt(h.slice(2, 4), 16);
    const b = Number.parseInt(h.slice(4, 6), 16);
    return `rgba(${r}, ${g}, ${b}, 0.12)`;
  }
  return 'rgba(0, 122, 255, 0.12)';
}

function loadAvatarPreset(): number {
  try {
    const raw = uni.getStorageSync(AVATAR_STORAGE_KEY);
    const n = Number(raw);
    if (!Number.isNaN(n) && n >= 0 && n < avatarPresets.length)
      return n;
  }
  catch (e) {
    console.warn('load avatar preset failed', e);
  }
  return 0;
}

const currentPresetId = ref(loadAvatarPreset());

const currentPreset = computed(() => {
  const id = currentPresetId.value;
  return avatarPresets.find(p => p.id === id) || avatarPresets[0];
});

function toggleAvatarPicker() {
  avatarPickerOpen.value = !avatarPickerOpen.value;
}

function selectAvatar(id: number) {
  currentPresetId.value = id;
  try {
    uni.setStorageSync(AVATAR_STORAGE_KEY, String(id));
  }
  catch (e) {
    console.warn('save avatar preset failed', e);
  }
  avatarPickerOpen.value = false;
}

function goAddressManagement() {
  uni.navigateTo({
    url: '/pages/sales/address-management/index',
  });
}

function handleLogout() {
  uni.showModal({
    title: '确认退出登录？',
    content: '退出后需要重新登录才能使用',
    cancelText: '取消',
    confirmText: '退出',
    confirmColor: '#FF3B30',
    success: async (res) => {
      if (res.confirm) {
        try {
          await userStore.logout();
        }
        catch (e) {
          console.warn('logout api failed', e);
          userStore.resetInfo();
        }
        try {
          uni.removeStorageSync('user_avatar_preset');
        }
        catch (e) {
          console.warn('clear avatar preset failed', e);
        }
        uni.reLaunch({
          url: '/pages/common/login/index',
        });
      }
    },
  });
}

onShow(() => {
  currentPresetId.value = loadAvatarPreset();
});
</script>

<style scoped lang="scss">
.settings-page {
  min-height: 100vh;
  padding: 32rpx 32rpx 200rpx;
  box-sizing: border-box;
  background: linear-gradient(180deg, var(--theme-bg-gradient-start) 0%, var(--theme-bg-gradient-end) 100%);
}

.settings-card {
  border-radius: var(--theme-card-radius);
  background-color: #ffffff;
  box-shadow: var(--theme-card-shadow);
  overflow: hidden;
}

.setting-row {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 28rpx 32rpx;
  border-bottom: 1rpx solid #f3f4f6;
}

.setting-row:last-of-type {
  border-bottom-width: 0;
}

.setting-label {
  font-size: 28rpx;
  color: var(--theme-text-title);
}

.setting-right {
  display: flex;
  align-items: center;
}

.setting-right .avatar-preview {
  margin-right: 16rpx;
}

.avatar-preview {
  width: 64rpx;
  height: 64rpx;
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
}

.avatar-person {
  width: 36rpx;
  height: 36rpx;
}

.arrow {
  font-size: 24rpx;
  color: var(--theme-text-subtitle);
}

.avatar-picker {
  padding: 24rpx 32rpx 32rpx;
  background-color: #fafafa;
  border-top: 1rpx solid #f3f4f6;
}

.avatar-grid {
  display: flex;
  flex-wrap: wrap;
}

.avatar-option {
  width: 25%;
  box-sizing: border-box;
  padding: 12rpx;
  display: flex;
  flex-direction: column;
  align-items: center;
}

.avatar-option .avatar-circle {
  margin-bottom: 8rpx;
}

.avatar-option.selected .avatar-circle {
  border: 4rpx solid #007AFF;
  box-sizing: border-box;
}

.avatar-circle {
  width: 96rpx;
  height: 96rpx;
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
}

.avatar-circle .avatar-person {
  width: 48rpx;
  height: 48rpx;
}

.avatar-label {
  font-size: 22rpx;
  color: var(--theme-text-subtitle);
}

.setting-hint {
  font-size: 24rpx;
  color: var(--theme-text-subtitle);
}

.logout-area {
  position: fixed;
  left: 0;
  right: 0;
  bottom: 0;
  padding: 24rpx 32rpx;
  padding-bottom: calc(24rpx + env(safe-area-inset-bottom, 0px));
  box-sizing: border-box;
  background-color: rgba(255, 255, 255, 0.98);
  box-shadow: 0 -10rpx 30rpx rgba(0, 0, 0, 0.05);
}

.logout-btn {
  width: 100%;
  padding: 24rpx 0;
  border-radius: var(--theme-btn-radius);
  border: none;
  font-size: 28rpx;
  color: #FF3B30;
  background-color: #ffffff;
}

.logout-btn:active {
  opacity: 0.9;
}
</style>
