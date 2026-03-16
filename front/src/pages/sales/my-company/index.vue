<template>
  <view class="my-company-page">
    <!-- 公司概要卡片 -->
    <view class="summary-card">
      <view class="summary-header">
        <view class="summary-title">
          <view class="company-name">
            {{ companyName || '未选择公司' }}
          </view>
          <view class="company-subtitle">
            销售团队 {{ teamCount }} 人
          </view>
        </view>
        <button
          class="manage-toggle"
          @tap="onManageTap"
        >
          {{ isManaging ? '取消' : '管理' }}
        </button>
      </view>
      <view class="summary-metrics">
        <view class="metric-item">
          <view class="metric-label">
            团队总订单
          </view>
          <view class="metric-value">
            {{ totalOrders }}
          </view>
        </view>
        <view class="metric-item">
          <view class="metric-label">
            团队优惠券
          </view>
          <view class="metric-value">
            {{ couponCount }}
          </view>
        </view>
      </view>
    </view>

    <!-- 我的团队 -->
    <view class="section-header">
      <view class="section-title">
        我的团队
      </view>
      <view
        v-if="isManaging"
        class="section-cancel"
        @tap="onCancelManage"
      >
        取消
      </view>
    </view>

    <scroll-view scroll-y class="team-list">
      <view
        v-for="member in members"
        :key="member.id"
        class="member-card"
      >
        <view class="member-main">
          <view class="member-avatar">
            <text>{{ memberInitial(member) }}</text>
          </view>
          <view class="member-info">
            <view class="member-name-row">
              <text class="member-name">{{ member.name || member.phone }}</text>
              <text
                v-if="member.id === currentUserId"
                class="member-tag-me"
              >
                我
              </text>
              <text
                v-if="member.isAdmin"
                class="member-role-tag"
              >
                管理员
              </text>
              <text
                v-if="member.removed"
                class="member-removed-tag"
              >
                已移除
              </text>
            </view>
            <view class="member-meta">
              <text class="member-phone">
                {{ member.phone }}
              </text>
              <text class="member-orders">
                订单数：{{ member.totalOrders ?? 0 }}
              </text>
            </view>
          </view>
        </view>

        <!-- 管理操作：仅在管理模式且对非自己、且未被移除的成员展示 -->
        <view
          v-if="isManaging && member.id !== currentUserId && !member.removed"
          class="member-actions"
        >
          <button
            class="btn-action btn-remove"
            @tap="confirmRemove(member)"
          >
            移除公司
          </button>
          <button
            class="btn-action btn-transfer"
            @tap="confirmTransfer(member)"
          >
            转交身份
          </button>
        </view>
      </view>

      <view
        v-if="!loading && members.length === 0"
        class="empty"
      >
        暂无团队成员
      </view>
    </scroll-view>
  </view>
</template>

<script setup lang="ts">
import { onShow } from '@dcloudio/uni-app';
import { ref } from 'vue';
import useUserStore from '@/store/modules/user';
import { CompanyApi, UserApi } from '@/api';

const userStore = useUserStore();

const loading = ref(false);
const companyName = ref('');
const teamCount = ref(0);
const totalOrders = ref(0);
const couponCount = ref(0);
const currentCompanyId = ref<number | null>(null);

interface MemberItem {
  id: number;
  name?: string;
  phone?: string;
  isAdmin?: boolean;
  totalOrders?: number;
  /** 是否为历史成员（当前已不属于该公司） */
  removed?: boolean;
}

const members = ref<MemberItem[]>([]);
const currentUserId = ref<number>(Number(userStore.user_id || 0));
const isManaging = ref(false);

const memberInitial = (m: MemberItem) => {
  const n = (m.name || m.phone || '').trim();
  if (!n)
    return '用';
  return n.slice(0, 1);
};

const ensureAdmin = () => {
  // 仅允许公司管理员访问（强制从后端再拉一次用户信息，避免缓存脏数据）
  return new Promise<boolean>((resolve) => {
    const id = Number(userStore.user_id || 0);
    if (!id) {
      uni.showToast({
        title: '请先登录',
        icon: 'none',
      });
      setTimeout(() => {
        uni.navigateBack();
        resolve(false);
      }, 800);
      return;
    }
    UserApi.getUser(id).then((user) => {
      userStore.setInfo({
        isAdmin: (user as any).isAdmin ?? false,
        companyId: user.companyId ?? userStore.companyId,
      });
      if (!(user as any).isAdmin) {
        uni.showToast({
          title: '仅公司管理员可访问',
          icon: 'none',
        });
        setTimeout(() => {
          uni.navigateBack();
          resolve(false);
        }, 800);
        return;
      }
      resolve(true);
    }).catch(() => {
      uni.showToast({
        title: '获取用户信息失败',
        icon: 'none',
      });
      setTimeout(() => {
        uni.navigateBack();
        resolve(false);
      }, 800);
    });
  });
};

const onManageTap = () => {
  isManaging.value = !isManaging.value;
};

const onCancelManage = () => {
  isManaging.value = false;
};

const loadData = async () => {
  loading.value = true;
  try {
    // 再次从后端读取用户信息，确保拿到最新 companyId
    const id = Number(userStore.user_id || 0);
    let companyId = userStore.companyId as number | undefined | null;
    if (id) {
      const user = await UserApi.getUser(id);
      companyId = user.companyId ?? companyId;
      userStore.setInfo({
        companyId,
        companyName: (user as any).companyName ?? userStore.companyName,
      });
    }

    if (!companyId) {
      companyName.value = '未选择公司';
      teamCount.value = 0;
      totalOrders.value = 0;
      couponCount.value = 0;
      members.value = [];
      return;
    }

    currentCompanyId.value = companyId;

    const [dashboard, memberList] = await Promise.all([
      CompanyApi.getCompanyDashboard(companyId),
      CompanyApi.listCompanyMembers(companyId),
    ]);

    companyName.value = dashboard.name;
    teamCount.value = dashboard.teamCount;
    totalOrders.value = dashboard.totalOrders;
    couponCount.value = dashboard.couponCount;

    members.value = memberList.map(m => ({
      id: m.id,
      name: m.name,
      phone: m.phone,
      isAdmin: m.isAdmin,
      totalOrders: m.totalOrders,
      removed: (m as any).removed === true,
    }));
  }
  finally {
    loading.value = false;
  }
};

onShow(async () => {
  const ok = await ensureAdmin();
  if (!ok)
    return;
  await loadData();
});

const confirmRemove = (member: MemberItem) => {
  uni.showModal({
    title: '确认移除',
    content: `确定将 ${member.name || member.phone} 移出公司？`,
    success(res) {
      if (!res.confirm)
        return;
      const companyId = currentCompanyId.value || (userStore.companyId as number | undefined | null);
      if (!companyId) {
        uni.showToast({
          title: '公司信息缺失，请稍后重试',
          icon: 'none',
        });
        return;
      }
      CompanyApi.removeCompanyMember(companyId, member.id).then(() => {
        uni.showToast({
          title: '已移除',
          icon: 'none',
        });
        // 重新拉取数据，保证与后端一致
        loadData();
      }).catch(() => {
        uni.showToast({
          title: '移除失败，请稍后重试',
          icon: 'none',
        });
      });
    },
  });
};

const confirmTransfer = (member: MemberItem) => {
  uni.showModal({
    title: '转交管理员',
    content: `确认将公司管理员身份转交给 ${member.name || member.phone}？转交后您将不再是管理员。`,
    success(res) {
      if (!res.confirm)
        return;
      const companyId = currentCompanyId.value || (userStore.companyId as number | undefined | null);
      if (!companyId) {
        uni.showToast({
          title: '公司信息缺失，请稍后重试',
          icon: 'none',
        });
        return;
      }
      CompanyApi.transferCompanyAdmin(companyId, member.id).then(() => {
        uni.showToast({
          title: '已转交',
          icon: 'none',
        });
        // 当前用户不再是管理员，更新本地状态并返回个人中心
        userStore.setInfo({
          isAdmin: false,
        });
        setTimeout(() => {
          uni.navigateBack();
        }, 800);
      }).catch(() => {
        uni.showToast({
          title: '转交失败，请稍后重试',
          icon: 'none',
        });
      });
    },
  });
};
</script>

<style scoped lang="scss">
.my-company-page {
  min-height: 100vh;
  padding: 24rpx 24rpx 40rpx;
  box-sizing: border-box;
  background-color: #f7f8fa;
}

.summary-card {
  padding: 24rpx 28rpx;
  border-radius: 24rpx;
  background-color: #ffffff;
  box-shadow: 0 8rpx 20rpx rgba(15, 23, 42, 0.04);
  margin-bottom: 24rpx;
}

.summary-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  margin-bottom: 16rpx;
}

.summary-title {
  flex: 1;
}

.company-name {
  font-size: 30rpx;
  font-weight: 600;
  color: #111827;
}

.company-subtitle {
  margin-top: 6rpx;
  font-size: 24rpx;
  color: #6b7280;
}

.manage-toggle {
  padding: 10rpx 28rpx;
  border-radius: 9999rpx;
  font-size: 26rpx;
  color: #2563eb;
  background-color: #eff6ff;
}

.summary-metrics {
  display: flex;
  align-items: center;
  justify-content: space-between;
  margin-top: 16rpx;
}

.metric-item {
  flex: 1;
  padding: 8rpx 4rpx;
}

.metric-label {
  font-size: 22rpx;
  color: #6b7280;
  margin-bottom: 4rpx;
}

.metric-value {
  font-size: 30rpx;
  font-weight: 600;
  color: #111827;
}

.section-header {
  margin: 16rpx 0 12rpx;
  display: flex;
  align-items: center;
  justify-content: flex-start;
}

.section-title {
  font-size: 30rpx;
  font-weight: 600;
  color: #111827;
}

.section-cancel {
  margin-left: auto;
  font-size: 24rpx;
  color: #9ca3af;
}

.team-list {
  height: calc(100vh - 260rpx);
}

.member-card {
  margin-bottom: 16rpx;
  padding: 18rpx 20rpx;
  border-radius: 20rpx;
  background-color: #ffffff;
  box-shadow: 0 4rpx 14rpx rgba(15, 23, 42, 0.04);
}

.member-main {
  display: flex;
  align-items: center;
}

.member-avatar {
  width: 72rpx;
  height: 72rpx;
  border-radius: 9999rpx;
  background-color: #e0f2fe;
  color: #0a7aff;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 32rpx;
  margin-right: 20rpx;
}

.member-info {
  flex: 1;
}

.member-name-row {
  display: flex;
  align-items: center;
}

.member-name {
  font-size: 28rpx;
  font-weight: 500;
  color: #111827;
}

.member-role-tag {
  margin-left: 8rpx;
  padding: 2rpx 10rpx;
  border-radius: 9999rpx;
  font-size: 20rpx;
  background-color: #0a7aff;
  color: #ffffff;
}

.member-removed-tag {
  margin-left: 8rpx;
  padding: 2rpx 10rpx;
  border-radius: 9999rpx;
  font-size: 20rpx;
  background-color: #f3f4f6;
  color: #9ca3af;
}

.member-meta {
  margin-top: 4rpx;
  font-size: 22rpx;
  color: #6b7280;
  display: flex;
  flex-direction: column;
  gap: 4rpx;
}

.member-phone {
  margin-right: 16rpx;
}

.member-orders {
  font-size: 22rpx;
  color: #4b5563;
}

.member-tag-me {
  margin-left: 8rpx;
  padding: 2rpx 10rpx;
  border-radius: 9999rpx;
  font-size: 20rpx;
  background-color: #fee2e2;
  color: #b91c1c;
}

.member-actions {
  margin-top: 12rpx;
  display: flex;
  justify-content: flex-end;
}

.btn-action {
  padding: 10rpx 20rpx;
  margin-left: 12rpx;
  border-radius: 9999rpx;
  font-size: 22rpx;
  line-height: 1;
}

.btn-remove {
  background-color: #fee2e2;
  color: #b91c1c;
}

.btn-transfer {
  background-color: #eff6ff;
  color: #1d4ed8;
}

.empty {
  margin-top: 40rpx;
  text-align: center;
  font-size: 24rpx;
  color: #9ca3af;
}
</style>

