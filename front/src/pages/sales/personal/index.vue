<template>
  <view class="personal-page">
    <!-- 个人信息卡片 -->
    <view class="profile-card">
      <view class="avatar">
        <text class="avatar-icon">👤</text>
      </view>
      <view class="profile-info">
        <view class="name">
          {{ displayName }}
        </view>
        <view class="company">
          {{ companyDisplay }}
        </view>
      </view>
    </view>

    <!-- 数据统计卡片 -->
    <view class="stats-card">
      <view class="stat-item" @tap="goOrders">
        <view class="stat-icon stat-icon-orders">
          🧾
        </view>
        <view class="stat-number">
          {{ ongoingOrdersCount }}
        </view>
        <view class="stat-label">
          进行中的订单
        </view>
      </view>

      <view class="stat-item" @tap="goCoupons">
        <view class="stat-icon stat-icon-coupons">
          🎁
          <view v-if="couponCount > 0" class="red-dot" />
        </view>
        <view class="stat-number">
          {{ couponCount }}
        </view>
        <view class="stat-label">
          优惠券
        </view>
      </view>

      <view class="stat-item" @tap="goPointsMall">
        <view class="stat-icon stat-icon-points">
          🏆
        </view>
        <view class="stat-number">
          {{ pointsDisplay }}
        </view>
        <view class="stat-label">
          我的积分
        </view>
      </view>
    </view>

    <!-- 功能菜单 -->
    <view class="menu-card">
      <view
        v-if="isCompanyAdmin"
        class="menu-item"
        @tap="goMyCompany"
      >
        <view class="menu-left">
          <text class="menu-icon">🏢</text>
          <text class="menu-title">我的公司</text>
        </view>
      </view>

      <view class="menu-item" @tap="goKnowledge">
        <view class="menu-left">
          <text class="menu-icon">📚</text>
          <text class="menu-title">知识库</text>
        </view>
      </view>

      <view class="menu-item" @tap="goExchangeRecords">
        <view class="menu-left">
          <text class="menu-icon">📦</text>
          <text class="menu-title">兑换记录</text>
        </view>
      </view>

      <view class="menu-item" @tap="openInviteModal">
        <view class="menu-left">
          <text class="menu-icon">🔑</text>
          <text class="menu-title">我的邀请码</text>
        </view>
      </view>

      <view class="menu-item" @tap="goSettings">
        <view class="menu-left">
          <text class="menu-icon">⚙️</text>
          <text class="menu-title">设置</text>
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
import type { Order } from '@/api/order';
import useUserStore from '@/store/modules/user';

const userStore = useUserStore();

const ongoingOrdersCount = ref(0);
const couponCount = ref(0);
const companyDisplay = ref('未选择公司');
const pointsDisplay = ref<number>(userStore.points ?? 0);
// 是否为公司管理员：直接在本页维护，确保与后端返回保持一致
const isCompanyAdmin = ref(false);

const displayName = computed(() => userStore.user_name || '未登录用户');

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

onShow(async () => {
  // 先从后端拉取最新用户信息（含 isAdmin / companyId / points）
  await loadPointsFromBackend();
  // 再根据最新的 companyId 计算公司名称和订单数
  await Promise.all([
    loadOngoingOrders(),
  ]);
});

const goOrders = () => {
  uni.switchTab({
    url: '/pages/sales/created/index',
  });
};

const goCoupons = () => {
  uni.showToast({
    title: '优惠券模块开发中',
    icon: 'none',
  });
};

const goPointsMall = () => {
  uni.switchTab({
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
  uni.showToast({
    title: '知识库模块开发中',
    icon: 'none',
  });
};

const goExchangeRecords = () => {
  uni.navigateTo({
    url: '/pages/sales/exchange-records/index',
  });
};

const goSettings = () => {
  uni.showToast({
    title: '设置模块开发中',
    icon: 'none',
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
  padding: 24rpx 24rpx 40rpx;
  box-sizing: border-box;
  background-color: #f7f8fa;
}

.profile-card {
  display: flex;
  align-items: center;
  padding: 24rpx 28rpx;
  border-radius: 24rpx;
  background-color: #ffffff;
  box-shadow: 0 8rpx 20rpx rgba(15, 23, 42, 0.05);
  margin-bottom: 24rpx;
}

.avatar {
  width: 96rpx;
  height: 96rpx;
  border-radius: 9999rpx;
  background: linear-gradient(135deg, #0a7aff, #3b82f6);
  display: flex;
  align-items: center;
  justify-content: center;
  margin-right: 24rpx;
}

.avatar-icon {
  font-size: 48rpx;
  color: #ffffff;
}

.profile-info {
  flex: 1;
  display: flex;
  flex-direction: column;
  justify-content: center;
}

.name {
  font-size: 32rpx;
  font-weight: 600;
  color: #111827;
}

.company {
  margin-top: 8rpx;
  font-size: 24rpx;
  color: #6b7280;
}

.stats-card {
  display: flex;
  align-items: stretch;
  justify-content: space-between;
  background-color: #ffffff;
  border-radius: 24rpx;
  padding: 20rpx 16rpx;
  margin-bottom: 24rpx;
  box-shadow: 0 8rpx 20rpx rgba(15, 23, 42, 0.04);
}

.stat-item {
  flex: 1;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  padding: 8rpx 4rpx;
}

.stat-item + .stat-item {
  border-left: 1px solid #f3f4f6;
}

.stat-icon {
  width: 64rpx;
  height: 64rpx;
  border-radius: 9999rpx;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 34rpx;
  margin-bottom: 10rpx;
  position: relative;
}

.stat-icon-orders {
  background-color: #e0f2fe;
  color: #0a7aff;
}

.stat-icon-coupons {
  background-color: #fef3c7;
  color: #f59e0b;
}

.stat-icon-points {
  background-color: #ede9fe;
  color: #7c3aed;
}

.red-dot {
  position: absolute;
  top: 6rpx;
  right: 8rpx;
  width: 14rpx;
  height: 14rpx;
  border-radius: 9999rpx;
  background-color: #ef4444;
}

.stat-number {
  font-size: 32rpx;
  font-weight: 600;
  color: #111827;
}

.stat-label {
  margin-top: 4rpx;
  font-size: 22rpx;
  color: #6b7280;
}

.menu-card {
  margin-top: 4rpx;
  border-radius: 24rpx;
  background-color: #ffffff;
  box-shadow: 0 8rpx 20rpx rgba(15, 23, 42, 0.04);
  overflow: hidden;
}

.menu-item {
  padding: 24rpx 28rpx;
  display: flex;
  align-items: center;
  justify-content: space-between;
  border-bottom: 1px solid #f3f4f6;
}

.menu-item:last-child {
  border-bottom-width: 0;
}

.menu-left {
  display: flex;
  align-items: center;
}

.menu-icon {
  width: 40rpx;
  font-size: 32rpx;
  margin-right: 20rpx;
}

.menu-title {
  font-size: 28rpx;
  color: #111827;
}

.menu-arrow {
  font-size: 26rpx;
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
  border-radius: 24rpx;
  background-color: #ffffff;
  padding: 24rpx 28rpx 32rpx;
  box-sizing: border-box;
}

.invite-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  margin-bottom: 16rpx;
}

.invite-title {
  font-size: 30rpx;
  font-weight: 600;
  color: #111827;
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

