<template>
  <view class="page">
    <view class="title">
      请选择您的身份
    </view>

    <view
      class="card"
      :class="{ disabled: salesLocked }"
      @tap="selectSales"
    >
      <view class="card-header">
        <nut-icon name="people" size="24" class="mr-12rpx" />
        <text class="card-title">销售人员</text>
      </view>
      <view class="card-desc">
        适用于公司内部销售同学，登录后可选择所属公司并快速为客户下单。
      </view>
      <view v-if="salesLocked" class="card-hint">
        {{ salesLockText }}
      </view>
      <view v-else class="card-tag sales">推荐</view>
    </view>

    <view class="card" @tap="selectPartner">
      <view class="card-header">
        <nut-icon name="link" size="24" class="mr-12rpx" />
        <text class="card-title">合作伙伴</text>
      </view>
      <view class="card-desc">
        适用于渠道 / 合作伙伴，需先提交企业及开票信息，审核通过后成为企业管理员。
      </view>
      <view class="card-tag partner">
        提交开票
      </view>
    </view>
  </view>
</template>

<script setup lang="ts">
import { onShow } from '@dcloudio/uni-app';
import { PartnerApi } from '@/api';
import { route, toast } from '@/utils/uni-helpers';
import useUserStore from '@/store/modules/user';

const userStore = useUserStore();
const invoiceStatus = ref<'pending' | 'approved' | 'rejected' | null>(null);

const salesLocked = computed(() => {
  if (invoiceStatus.value === 'pending') return true;
  if (invoiceStatus.value === 'approved') return true;
  if (invoiceStatus.value === 'rejected') return !userStore.partnerRejectedAcknowledged;
  return false;
});

const salesLockText = computed(() => {
  if (invoiceStatus.value === 'pending') return '公司申请审核中，暂不可选';
  if (invoiceStatus.value === 'approved') return '已通过审核，请通过合作伙伴入口进入下单';
  if (invoiceStatus.value === 'rejected') return '审核未通过，请先确认后再以销售身份入驻';
  return '';
});

async function loadInvoiceStatus() {
  userStore.normalizeUserId();
  const userId = Number(userStore.user_id || 0);
  if (!userId) {
    invoiceStatus.value = null;
    return;
  }
  try {
    const res = await PartnerApi.getInvoiceStatus(userId);
    invoiceStatus.value = (res?.status as any) ?? null;
    // 当状态不是 rejected 时，清空“已确认未通过”标记，避免旧标记影响后续流程
    if (invoiceStatus.value !== 'rejected' && userStore.partnerRejectedAcknowledged) {
      userStore.setInfo({ partnerRejectedAcknowledged: false });
    }
  }
  catch {
    invoiceStatus.value = null;
  }
}

function selectSales() {
  if (salesLocked.value) {
    toast(salesLockText.value || '暂不可选');
    return;
  }
  userStore.setInfo({
    currentRole: 'sales',
  });
  route({
    type: 'redirectTo',
    url: '/pages/sales/company-selection/index',
  });
}

function selectPartner() {
  userStore.setInfo({
    currentRole: 'partner',
  });
  // 根据审核状态进行不同引导，避免进入“空白表单”
  if (invoiceStatus.value === 'pending') {
    // 审核中：进入合作伙伴资料页展示“审核中”状态卡片
    route({ type: 'navigateTo', url: '/pages/partner/invoice-submission/index' });
    return;
  }
  if (invoiceStatus.value === 'approved') {
    // 已通过审核：进入合作伙伴资料页展示“审核通过”状态卡片，并在该页完成跳转
    route({ type: 'navigateTo', url: '/pages/partner/invoice-submission/index' });
    return;
  }
  if (invoiceStatus.value === 'rejected') {
    // 审核未通过：进入合作伙伴资料页展示“审核失败”确认卡片
    // 同时视为用户已确认“未通过”，解除销售入口封锁
    userStore.setInfo({ partnerRejectedAcknowledged: true });
    route({ type: 'navigateTo', url: '/pages/partner/invoice-submission/index' });
    return;
  }

  route({ type: 'navigateTo', url: '/pages/partner/invoice-submission/index' });
}

onShow(() => {
  loadInvoiceStatus();
});
</script>

<style scoped lang="scss">
.page {
  @apply min-h-screen px-64rpx pt-80rpx pb-64rpx;
  background: linear-gradient(180deg, var(--theme-bg-gradient-start) 0%, var(--theme-bg-gradient-end) 100%);
}

.title {
  @apply mb-48rpx text-40rpx font-600;
  color: var(--theme-text-title);
}

.card {
  @apply relative mb-32rpx px-48rpx pt-36rpx pb-40rpx;
  border-radius: var(--theme-card-radius);
  background: #ffffff;
  box-shadow: var(--theme-card-shadow);

  &.disabled {
    opacity: 0.6;
  }
}

.card-hint {
  @apply absolute top-28rpx right-40rpx px-16rpx py-6rpx rounded-full text-22rpx;
  background: #9ca3af;
  color: #fff;
}

.card-header {
  @apply flex items-center mb-12rpx;
}

.card-title {
  @apply text-32rpx font-500;
  color: var(--theme-text-title);
}

.card-desc {
  @apply text-26rpx leading-40rpx;
  color: var(--theme-text-subtitle);
}

.card-tag {
  @apply absolute top-28rpx right-40rpx px-16rpx py-6rpx rounded-full text-22rpx;

  &.sales {
    background: rgba(0, 122, 255, 0.1);
    color: #007AFF;
  }

  &.partner {
    background: rgba(250, 173, 20, 0.12);
    color: $u-warning;
  }
}

.tip {
  @apply mt-32rpx text-24rpx;
  color: var(--theme-text-subtitle);
}
</style>

