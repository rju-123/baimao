<template>
  <view class="personal-page">
    <!-- 个人信息卡片 -->
    <view class="profile-card">
      <view class="avatar-circle" :style="{ backgroundColor: avatarBgColor }">
        <view class="avatar-person i-mdi-account" :style="{ color: avatarColor }" />
      </view>
      <view class="profile-info">
        <view class="name">{{ displayName }}</view>
        <view class="company">{{ companyDisplay }}</view>
      </view>
    </view>

    <!-- 数据统计卡片 -->
    <view class="stats-row">
      <view class="stat-card" @tap="goOrders">
        <view class="stat-number">{{ ongoingOrdersCount }}</view>
        <view class="stat-label">进行中的订单</view>
      </view>
      <view class="stat-card" @tap="goCoupons">
        <view class="stat-number">{{ couponCount }}</view>
        <view class="stat-label">优惠券</view>
        <view v-if="couponCount > 0" class="red-dot" />
      </view>
      <view class="stat-card" @tap="goPointsMall">
        <view class="stat-number">{{ pointsDisplay }}</view>
        <view class="stat-label">我的积分</view>
      </view>
    </view>

    <!-- 功能菜单 -->
    <view class="tools-section">
      <view class="tools-card">
        <view
          v-if="isCompanyAdmin"
          class="tool-item"
          @tap="goMyCompany"
        >
          <text class="tool-title">我的公司</text>
          <text class="tool-arrow">›</text>
        </view>
        <view class="tool-item" @tap="goKnowledge">
          <text class="tool-title">知识库</text>
          <text class="tool-arrow">›</text>
        </view>
        <view class="tool-item" @tap="goExchangeRecords">
          <text class="tool-title">兑换记录</text>
          <text class="tool-arrow">›</text>
        </view>
        <view class="tool-item" @tap="openInviteModal">
          <text class="tool-title">我的邀请码</text>
          <text class="tool-arrow">›</text>
        </view>
        <view class="tool-item" @tap="goSettings">
          <text class="tool-title">设置</text>
          <text class="tool-arrow">›</text>
        </view>
      </view>
    </view>

    <!-- 邀请码弹窗（占位样式，后续可接入真实数据与二维码） -->
    <view v-if="inviteVisible" class="invite-mask" @tap="closeInviteModal">
      <view class="invite-modal" @tap.stop>
        <view class="invite-header">
          <text class="invite-title">我的邀请码</text>
          <text class="invite-close" @tap="closeInviteModal">✕</text>
        </view>
        <view class="invite-code">
          <text class="code-text">{{ inviteCode }}</text>
          <text class="code-copy" @tap="copyInviteCode">复制</text>
        </view>
        <view class="invite-tip">
          成功邀请好友注册，您将获得积分奖励
        </view>
        <view class="invite-qrcode">
          <view class="qrcode-placeholder">
            二维码占位
          </view>
        </view>
        <view class="invite-subtip">
          长按二维码保存图片分享给好友
        </view>
      </view>
    </view>
  </view>
</template>

<script setup lang="ts">
import { computed, ref } from 'vue';
import { onShow } from '@dcloudio/uni-app';
import { CompanyApi, OrderApi, UserApi } from '@/api';
import { get } from '@/utils/request';
import type { Order } from '@/api/order';
import useUserStore from '@/store/modules/user';

const userStore = useUserStore();

const ongoingOrdersCount = ref(0);
const couponCount = ref(0);
const companyDisplay = ref('未选择公司');
const pointsDisplay = ref<number>(userStore.points ?? 0);
// 是否为公司管理员：直接在本页维护，确保与后端返回保持一致
const isCompanyAdmin = ref(false);

const displayName = computed(() => userStore.user_name || userStore.phone || '未登录用户');

const AVATAR_STORAGE_KEY = 'user_avatar_preset';
const avatarPresets: { id: number; color: string; label: string }[] = [
  { id: 0, color: '#007AFF', label: '蓝色' },
  { id: 1, color: '#34C759', label: '绿色' },
  { id: 2, color: '#FF9500', label: '橙色' },
  { id: 3, color: '#FF3B30', label: '红色' },
  { id: 4, color: '#AF52DE', label: '紫色' },
  { id: 5, color: '#5856D6', label: '靛蓝' },
  { id: 6, color: '#00C7BE', label: '青色' },
  { id: 7, color: '#8E8E93', label: '灰色' },
];
const avatarColor = ref('#007AFF');
const avatarBgColor = computed(() => {
  const c = avatarColor.value;
  if (c.startsWith('#')) {
    const hex = c.slice(1);
    const r = Number.parseInt(hex.slice(0, 2), 16);
    const g = Number.parseInt(hex.slice(2, 4), 16);
    const b = Number.parseInt(hex.slice(4, 6), 16);
    return `rgba(${r}, ${g}, ${b}, 0.12)`;
  }
  return 'rgba(0, 122, 255, 0.12)';
});

function refreshAvatarColor() {
  try {
    const raw = uni.getStorageSync(AVATAR_STORAGE_KEY);
    const n = Number(raw);
    if (!Number.isNaN(n) && n >= 0 && n < avatarPresets.length)
      avatarColor.value = avatarPresets[n].color;
    else
      avatarColor.value = '#007AFF';
  }
  catch (e) {
    avatarColor.value = '#007AFF';
  }
}

const inviteVisible = ref(false);
const inviteCode = ref('ABC123XYZ');

const loadPointsFromBackend = async () => {
  const id = Number(userStore.user_id || 0);
  if (!id)
    return;
  try {
    const user = await UserApi.getUser(id);
    const pts = user.points ?? 0;
    userStore.setInfo({
      points: pts,
      user_name: user.name || '',
      isAdmin: (user as any).isAdmin ?? userStore.isAdmin,
      companyId: user.companyId ?? userStore.companyId,
      companyName: (user as any).companyName ?? userStore.companyName,
    });
    pointsDisplay.value = pts;
    companyDisplay.value = (user as any).companyName || userStore.companyName || '未选择公司';
    isCompanyAdmin.value = (user as any).isAdmin === true;
  }
  catch (e) {
    console.warn('load points failed', e);
  }
};

const loadCompanyName = async () => {
  // 当前已直接从 /users/:id 返回 companyName 并在 loadPointsFromBackend 中赋值，
  // 这里作为兜底：如果仍然没有 companyName，再尝试用 companyId 去公司列表里匹配一次。
  if (companyDisplay.value !== '未选择公司' && companyDisplay.value)
    return;
  if (userStore.companyName) {
    companyDisplay.value = userStore.companyName;
    return;
  }
  const companyId = userStore.companyId;
  if (!companyId)
    return;
  try {
    const companies = await CompanyApi.listCompanies();
    const matched = companies.find(item => item.id === companyId);
    if (matched?.name)
      companyDisplay.value = matched.name;
  }
  catch (e) {
    console.warn('load company failed', e);
  }
};

const loadOngoingOrders = async () => {
  const userId = Number(userStore.user_id || 0);
  if (!userId) {
    ongoingOrdersCount.value = 0;
    return;
  }
  try {
    const list = await OrderApi.listOrders({ userId });
    const ongoingStatuses = ['pending_contract', 'pending_fulfillment', 'in_progress'];
    ongoingOrdersCount.value = (list as Order[]).filter(item => ongoingStatuses.includes(item.status)).length;
  }
  catch (e) {
    console.warn('load orders failed', e);
    ongoingOrdersCount.value = 0;
  }
};

const loadCouponCount = async () => {
  const userId = Number(userStore.user_id || 0);
  if (!userId) {
    couponCount.value = 0;
    return;
  }
  try {
    const list = await get<any[]>(`/coupons?userId=${encodeURIComponent(String(userId))}&status=available`);
    couponCount.value = Array.isArray(list) ? list.length : 0;
  }
  catch (e) {
    console.warn('load coupon count failed', e);
    couponCount.value = 0;
  }
};

onShow(async () => {
  refreshAvatarColor();
  // 先从后端拉取最新用户信息（含 isAdmin / companyId / points）
  await loadPointsFromBackend();
  // 再根据最新的 companyId 计算公司名称和订单数
  await Promise.all([
    loadOngoingOrders(),
    loadCouponCount(),
  ]);
});

const goOrders = () => {
  uni.switchTab({
    url: '/pages/sales/created/index',
  });
};

const goCoupons = () => {
  uni.navigateTo({
    url: '/pages/sales/coupons/index',
  });
};

const goPointsMall = () => {
  uni.navigateTo({
    url: '/pages/sales/points-mall/index',
  });
};

const goMyCompany = () => {
  if (!isCompanyAdmin.value) {
    uni.showToast({
      title: '仅公司管理员可访问',
      icon: 'none',
    });
    return;
  }
  uni.navigateTo({
    url: '/pages/sales/my-company/index',
  });
};

const goKnowledge = () => {
  uni.navigateTo({
    url: '/pages/sales/knowledge/index',
  });
};

const goExchangeRecords = () => {
  uni.navigateTo({
    url: '/pages/sales/exchange-records/index',
  });
};

const goSettings = () => {
  uni.navigateTo({
    url: '/pages/sales/settings/index',
  });
};

const openInviteModal = () => {
  inviteVisible.value = true;
};

const closeInviteModal = () => {
  inviteVisible.value = false;
};

const copyInviteCode = () => {
  uni.setClipboardData({
    data: inviteCode.value,
    success() {
      uni.showToast({
        title: '已复制邀请码',
        icon: 'none',
      });
    },
  });
};
</script>

<style scoped lang="scss">
.personal-page {
  min-height: 100vh;
  padding: 32rpx 32rpx 48rpx;
  box-sizing: border-box;
  background: linear-gradient(180deg, var(--theme-bg-gradient-start) 0%, var(--theme-bg-gradient-end) 100%);
}

/* 个人信息卡片 */
.profile-card {
  display: flex;
  align-items: center;
  padding: 32rpx 40rpx;
  border-radius: 24rpx;
  background-color: #ffffff;
  margin-bottom: 28rpx;
  box-shadow: 0 2rpx 12rpx rgba(0, 0, 0, 0.04);
}

.avatar-circle {
  width: 120rpx;
  height: 120rpx;
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
  margin-right: 28rpx;
}

.avatar-person {
  width: 56rpx;
  height: 56rpx;
}

.profile-info {
  flex: 1;
  display: flex;
  flex-direction: column;
  justify-content: center;
}

.name {
  font-size: 36rpx;
  font-weight: 700;
  color: #111827;
}

.company {
  margin-top: 8rpx;
  font-size: 26rpx;
  color: #6b7280;
}

/* 数据统计卡片 */
.stats-row {
  display: flex;
  gap: 20rpx;
  margin-bottom: 32rpx;
}

.stat-card {
  flex: 1;
  padding: 28rpx 16rpx;
  border-radius: 20rpx;
  background-color: #ffffff;
  box-shadow: 0 2rpx 12rpx rgba(0, 0, 0, 0.04);
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  position: relative;
}

.stat-number {
  font-size: 40rpx;
  font-weight: 700;
  color: #111827;
}

.stat-label {
  margin-top: 8rpx;
  font-size: 24rpx;
  color: #6b7280;
}

.red-dot {
  position: absolute;
  top: 16rpx;
  right: 24rpx;
  width: 16rpx;
  height: 16rpx;
  border-radius: 9999rpx;
  background-color: #ef4444;
}

/* 功能菜单 */
.tools-section {
  margin-bottom: 32rpx;
}

.tools-card {
  border-radius: 20rpx;
  background-color: #ffffff;
  box-shadow: 0 2rpx 12rpx rgba(0, 0, 0, 0.04);
  overflow: hidden;
}

.tool-item {
  padding: 28rpx 32rpx;
  display: flex;
  align-items: center;
  border-bottom: 1rpx solid #f3f4f6;
}

.tool-item:last-child {
  border-bottom: none;
}

.tool-title {
  flex: 1;
  font-size: 30rpx;
  font-weight: 500;
  color: #111827;
}

.tool-arrow {
  font-size: 32rpx;
  color: #9ca3af;
}

.invite-mask {
  position: fixed;
  left: 0;
  top: 0;
  right: 0;
  bottom: 0;
  background-color: rgba(0, 0, 0, 0.5);
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 999;
}

.invite-modal {
  width: 80%;
  border-radius: var(--theme-card-radius);
  background-color: #ffffff;
  padding: 32rpx 40rpx 40rpx;
  box-sizing: border-box;
  box-shadow: var(--theme-card-shadow);
}

.invite-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  margin-bottom: 20rpx;
}

.invite-title {
  font-size: 30rpx;
  font-weight: 600;
  color: var(--theme-text-title);
}

.invite-close {
  font-size: 28rpx;
  color: #9ca3af;
}

.invite-code {
  display: flex;
  align-items: center;
  justify-content: center;
  margin: 12rpx 0 8rpx;
}

.code-text {
  font-size: 32rpx;
  font-weight: 600;
  letter-spacing: 4rpx;
  color: #111827;
}

.code-copy {
  margin-left: 16rpx;
  font-size: 24rpx;
  color: #2563eb;
}

.invite-tip {
  text-align: center;
  font-size: 24rpx;
  color: #f97316;
  margin-bottom: 16rpx;
}

.invite-qrcode {
  display: flex;
  align-items: center;
  justify-content: center;
  margin-bottom: 12rpx;
}

.qrcode-placeholder {
  width: 260rpx;
  height: 260rpx;
  border-radius: 16rpx;
  background-color: #f3f4f6;
  display: flex;
  align-items: center;
  justify-content: center;
  color: #9ca3af;
  font-size: 24rpx;
}

.invite-subtip {
  text-align: center;
  font-size: 22rpx;
  color: #6b7280;
}
</style>

