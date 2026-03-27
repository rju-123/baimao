<template>
  <view class="page">
    <view class="card">
      <view class="card-header">
        <view class="card-title">
          白帽子业务平台
        </view>
        <view class="card-subtitle">
          专注网络安全，共筑数字防线
        </view>
      </view>

      <view class="btn-group">
        <button class="primary-btn" @tap="handleQuickLogin">
          快捷登录
        </button>
        <button class="ghost-btn" @tap="handleCodeLogin">
          通过手机验证码登录
        </button>
      </view>

      <view class="agreement">
        <text class="agreement-text">登录即表示同意</text>
        <text class="link">《用户协议》</text>
        <text class="agreement-text">和</text>
        <text class="link">《隐私政策》</text>
      </view>

      <view class="card-footer">
        —— EST. 2024 ORDRE INC ——
      </view>
    </view>
  </view>
</template>

<script setup lang="ts">
import { onLoad } from '@dcloudio/uni-app';
import { route, toast } from '@/utils/uni-helpers';
import { HOME_PATH, LOGIN_PATH, removeQueryString } from '@/router';
import useUserStore from '@/store/modules/user';

const userStore = useUserStore();
let redirect = HOME_PATH;

async function handleQuickLogin() {
  try {
    await userStore.authLogin('weixin');
    toast('登录成功', 'success');
    setTimeout(() => {
      route({ type: 'redirectTo', url: '/pages/common/role-selection/index' });
    }, 400);
  }
  catch (err: any) {
    const message = err?.message || err?.msg || err?.error || '快捷登录失败，请稍后再试';
    toast(message);
  }
}

function handleCodeLogin() {
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
  min-height: 100vh;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  padding: 48rpx 64rpx 64rpx;
  box-sizing: border-box;
  background-image:
    radial-gradient(circle at 1px 1px, rgba(0, 0, 0, 0.06) 1px, transparent 0),
    linear-gradient(180deg, #F8F8F8 0%, #E6F0FF 100%);
  background-size: 24rpx 24rpx, auto;
  background-position: 0 0, 0 0;
}

.card {
  width: 100%;
  max-width: 600rpx;
  padding: 80rpx 64rpx 64rpx;
  border-radius: 60rpx;
  background: #ffffff;
  box-shadow: 0 20rpx 60rpx rgba(0, 122, 255, 0.08);
  display: flex;
  flex-direction: column;
  align-items: center;
}

.card-header {
  width: 100%;
  text-align: center;
}

.card-title {
  font-size: 48rpx;
  font-weight: 700;
  color: #333333;
  margin-bottom: 16rpx;
}

.card-subtitle {
  font-size: 28rpx;
  color: #666666;
  line-height: 1.5;
}

.btn-group {
  width: 100%;
  display: flex;
  flex-direction: column;
  gap: 30rpx;
  margin-top: 100rpx;
}

.primary-btn {
  width: 100%;
  padding: 28rpx 0;
  font-size: 30rpx;
  font-weight: 600;
  text-align: center;
  border: none;
  border-radius: 24rpx;
  color: #ffffff;
  background: #007AFF;

  &::after {
    border: none;
  }
}

.ghost-btn {
  width: 100%;
  padding: 28rpx 0;
  font-size: 30rpx;
  font-weight: 500;
  text-align: center;
  border-radius: 24rpx;
  color: #007AFF;
  background: #ffffff;
  border: 1px solid #E0E0E0;

  &::after {
    border: none;
  }
}

.agreement {
  margin-top: 120rpx;
  font-size: 24rpx;
  color: #999999;
  text-align: center;
}

.agreement-text {
  margin: 0 4rpx;
}

.link {
  color: #007AFF;
  margin: 0 4rpx;
}

.card-footer {
  margin-top: 48rpx;
  font-size: 20rpx;
  color: #CCCCCC;
  letter-spacing: 2rpx;
  text-align: center;
}
</style>
