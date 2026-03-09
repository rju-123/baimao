<template>
  <view class="page">
    <view class="logo-wrap">
      <view class="logo-circle" />
      <view class="app-name">
        白帽子业务平台
      </view>
      <view class="sub-title">
        为合作伙伴与销售人员提供一站式下单体验
      </view>
    </view>

    <view class="card">
      <view class="card-title">
        欢迎登录白帽子平台
      </view>
      <view class="card-subtitle">
        请选择登录方式进入销售工作台
      </view>
      <view class="btn-group">
        <button class="primary-btn" @tap="handleCodeLogin">
          通过手机验证码登录
        </button>
        <button class="ghost-btn" @tap="handleQuickLogin">
          快捷登录
        </button>
      </view>

      <view class="agreement" @tap="toggleAgree">
        <view :class="['checkbox', agree ? 'checkbox-checked' : '']">
          <text v-if="agree" class="checkbox-icon">✓</text>
        </view>
        <text class="agreement-text">我已阅读并同意</text>
        <text class="link">《用户协议》</text>
        <text class="agreement-text">和</text>
        <text class="link">《隐私政策》</text>
      </view>
    </view>

    <view class="wechat-tip">
      也可在微信内使用本小程序，获得更佳体验
    </view>
  </view>
</template>

<script setup lang="ts">
import { onLoad } from '@dcloudio/uni-app';
import { route, toast } from '@/utils/uni-helpers';
import { HOME_PATH, LOGIN_PATH, removeQueryString } from '@/router';
import useUserStore from '@/store/modules/user';

const agree = ref(false);
const userStore = useUserStore();
let redirect = HOME_PATH;

function toggleAgree() {
  agree.value = !agree.value;
}

function ensureAgree(): boolean {
  if (!agree.value) {
    toast('请先阅读并同意用户协议与隐私政策');
    return false;
  }
  return true;
}

function handleQuickLogin() {
  if (!ensureAgree())
    return;

  // 小程序快捷登录：走微信授权 + 后端 loginByCode，再进入身份选择页
  userStore.authLogin('weixin').then(() => {
    toast('登录成功', 'success');
    setTimeout(() => {
      route({
        type: 'redirectTo',
        url: '/pages/common/role-selection/index',
      });
    }, 400);
  }).catch((err: any) => {
    const message = err?.message || err?.msg || err?.error || '快捷登录失败，请稍后再试';
    toast(message);
  });
}

function handleCodeLogin() {
  if (!ensureAgree())
    return;
  // 通过手机验证码登录：进入手机号 + 验证码登录页
  const url = `/pages/common/verification-login/index${
    redirect && redirect !== HOME_PATH
      ? `?redirect=${encodeURIComponent(redirect)}`
      : ''
  }`;
  route({
    type: 'redirectTo',
    url,
  });
}

onLoad((options: any) => {
  if (options?.redirect && removeQueryString(options.redirect) !== LOGIN_PATH) {
    redirect = decodeURIComponent(options.redirect);
  }
});
</script>

<style lang="scss" scoped>
.page {
  @apply min-h-screen px-40rpx pt-120rpx pb-40rpx;
  background: #f7f8fa;
}

.logo-wrap {
  @apply flex flex-col items-center mb-80rpx;

  .logo-circle {
    @apply mb-24rpx rounded-full;
    width: 120rpx;
    height: 120rpx;
    background-image: linear-gradient(135deg, #0A7AFF, #21d59d);
  }

  .app-name {
    @apply text-40rpx font-600 mb-8rpx;
    color: #1b233b;
  }

  .sub-title {
    @apply text-26rpx text-center;
    color: $u-tips-color;
  }
}

.card {
  @apply rounded-24rpx px-32rpx pt-32rpx pb-40rpx;
  background: #ffffff;
  box-shadow: 0 10rpx 30rpx rgba(0, 0, 0, 0.04);

  .card-title {
    @apply mb-8rpx text-34rpx font-600;
    color: #1b233b;
  }

  .card-subtitle {
    @apply mb-32rpx text-26rpx;
    color: $u-tips-color;
  }

  .btn-group {
    @apply flex flex-col gap-24rpx mb-24rpx;
  }
}

.primary-btn {
  @apply py-20rpx rounded-full text-30rpx border-none;
  color: #ffffff;
  background-image: linear-gradient(90deg, #0A7AFF, #21d59d);

  &::after {
    @apply border-none;
  }
}

.ghost-btn {
  @apply py-20rpx rounded-full text-30rpx bg-transparent;
  color: #0A7AFF;
  border-width: 2rpx;
  border-style: solid;
  border-color: rgba(10, 122, 255, 0.3);

  &::after {
    @apply border-none;
  }
}

.agreement {
  @apply mt-12rpx flex items-center text-24rpx;
  color: $u-tips-color;
}

.agreement-text {
  margin: 0 4rpx;
}

.checkbox {
  @apply mr-16rpx flex items-center justify-center;
  width: 40rpx;
  height: 40rpx;
  border-radius: 8rpx;
  border-width: 3rpx;
  border-style: solid;
  border-color: rgba(10, 122, 255, 0.85);
  background-color: #ffffff;
  box-shadow: 0 0 4rpx rgba(0, 0, 0, 0.08);
}

.checkbox-checked {
  background-color: #0A7AFF;
  border-color: #0A7AFF;
}

.checkbox-icon {
  @apply text-26rpx;
  color: #ffffff;
}

.link {
  color: $u-warning;
  margin: 0 4rpx;
}

.wechat-tip {
  @apply mt-40rpx text-center text-24rpx;
  color: $u-tips-color;
}
</style>
