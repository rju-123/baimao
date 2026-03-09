<template>
  <view class="page">
    <view class="title">
      请选择您的身份
    </view>

    <view class="card" @tap="selectSales">
      <view class="card-header">
        <nut-icon name="people" size="24" class="mr-12rpx" />
        <text class="card-title">销售人员</text>
      </view>
      <view class="card-desc">
        适用于公司内部销售同学，登录后可选择所属公司并快速为客户下单。
      </view>
      <view class="card-tag sales">
        推荐
      </view>
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
        敬请期待
      </view>
    </view>

    <view class="tip">
      当前版本优先支持「销售人员」路径，合作伙伴功能稍后补充。
    </view>
  </view>
</template>

<script setup lang="ts">
import { route, toast } from '@/utils/uni-helpers';
import useUserStore from '@/store/modules/user';

const userStore = useUserStore();

function selectSales() {
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
  toast('合作伙伴功能开发中，当前仅提供样式展示');
  route({
    type: 'navigateTo',
    url: '/pages/partner/invoice-submission/index',
  });
}
</script>

<style scoped lang="scss">
.page {
  @apply min-h-screen px-40rpx pt-80rpx pb-40rpx;
  background: #f7f8fa;
}

.title {
  @apply mb-40rpx text-40rpx font-600;
  color: #1b233b;
}

.card {
  @apply relative mb-24rpx px-32rpx pt-28rpx pb-32rpx rounded-24rpx;
  background: #ffffff;
  box-shadow: 0 10rpx 30rpx rgba(0, 0, 0, 0.04);
}

.card-header {
  @apply flex items-center mb-12rpx;
}

.card-title {
  @apply text-32rpx font-500;
  color: #1b233b;
}

.card-desc {
  @apply text-26rpx leading-40rpx;
  color: $u-tips-color;
}

.card-tag {
  @apply absolute top-24rpx right-32rpx px-16rpx py-4rpx rounded-full text-22rpx;

  &.sales {
    background: rgba(10, 122, 255, 0.1);
    color: #0A7AFF;
  }

  &.partner {
    background: rgba(250, 173, 20, 0.12);
    color: $u-warning;
  }
}

.tip {
  @apply mt-20rpx text-24rpx;
  color: $u-tips-color;
}
</style>

