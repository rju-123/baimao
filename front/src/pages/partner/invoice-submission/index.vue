<template>
  <view class="page">
    <view class="title">
      合作伙伴资料提交（占位）
    </view>
    <view class="desc">
      当前版本暂未实现合作伙伴完整流程，仅展示样式。
    </view>
    <view class="placeholder-card">
      <view class="line" />
      <view class="line short" />
      <view class="line" />
      <view class="line short" />
    </view>
    <button class="back-btn" @tap="goBack">
      返回
    </button>
  </view>
</template>

<script setup lang="ts">
function goBack() {
  uni.navigateBack();
}
</script>

<style scoped lang="scss">
.page {
  @apply min-h-screen px-40rpx pt-80rpx pb-40rpx;
  background: #f7f8fa;
}

.title {
  @apply mb-16rpx text-36rpx font-600;
  color: #1b233b;
}

.desc {
  @apply mb-32rpx text-26rpx;
  color: $u-tips-color;
}

.placeholder-card {
  @apply mb-40rpx px-32rpx py-32rpx rounded-24rpx;
  background: #ffffff;
  box-shadow: 0 10rpx 30rpx rgba(0, 0, 0, 0.04);
}

.line {
  @apply mb-20rpx rounded-full;
  height: 24rpx;
  background: #f0f2f5;

  &.short {
    width: 60%;
  }
}

.back-btn {
  @apply py-20rpx rounded-full text-30rpx border-none;
  color: #ffffff;
  background-image: linear-gradient(90deg, #0A7AFF, #21d59d);

  &::after {
    @apply border-none;
  }
}
</style>

