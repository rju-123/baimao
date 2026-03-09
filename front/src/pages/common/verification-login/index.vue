<template>
  <view>
    <view class="login-form-wrap">
      <view class="title">
        手机验证码登录
      </view>
      <nut-input v-model="tel" type="number" placeholder="请输入手机号" class="u-border-bottom" />
      <view class="u-border-bottom my-40rpx flex">
        <nut-input v-model="code" type="number" placeholder="请输入验证码" class="flex-1" />
        <nut-button type="success" size="small" :disabled="countdown > 0" @click="getCode">
          {{ countdown > 0 ? `${countdown}秒后重发` : '获取验证码' }}
        </nut-button>
      </view>
      <button class="login-btn" :style="[inputStyle]" @tap="submit">
        登录 <text class="i-mdi-login" />
      </button>
    </view>
    <view class="hint">
      登录代表同意
      <text class="link">用户协议、隐私政策，</text>
      并授权使用您的账号信息（如昵称、头像、收货地址）以便您统一管理
    </view>
  </view>
</template>

<script setup lang="ts">
import type { CSSProperties } from 'vue';
import { onUnmounted } from 'vue';
import { onLoad } from '@dcloudio/uni-app';
import { CommonApi } from '@/api';
import { toast, route, test, color } from '@/utils/uni-helpers';
import { HOME_PATH, isTabBarPath, LOGIN_PATH, removeQueryString } from '@/router';
import useUserStore from '@/store/modules/user';

const tel = ref<string>('');
const code = ref<string>('');
const countdown = ref(0);
let redirect = HOME_PATH;
let timer: ReturnType<typeof setInterval> | null = null;

const inputStyle = computed<CSSProperties>(() => {
  const style: CSSProperties = {};
  if (tel.value && code.value) {
    style.color = '#fff';
    style.backgroundColor = color.warning;
  }
  return style;
});

async function getCode() {
  if (countdown.value > 0)
    return;
  if (!test.mobile(tel.value)) {
    toast('请输入正确的手机号');
    return;
  }
  uni.showLoading({ title: '正在获取验证码' });
  try {
    await CommonApi.sendCode({ phone: tel.value });
    toast('验证码已发送，测试环境固定为 1234');
    countdown.value = 60;
    timer = setInterval(() => {
      countdown.value--;
      if (countdown.value <= 0 && timer) {
        clearInterval(timer);
        timer = null;
      }
    }, 1000);
  }
  catch {
    toast('验证码发送失败，请稍后重试');
  }
  finally {
    uni.hideLoading();
  }
}

async function submit() {
  if (!test.mobile(tel.value)) {
    toast('请输入正确的手机号');
    return;
  }
  if (!code.value) {
    toast('请输入验证码');
    return;
  }
  const userStore = useUserStore();
  try {
    await userStore.login({ phone: tel.value, code: code.value });
    toast('登录成功', 'success');
    setTimeout(() => {
      // 登录成功后统一进入角色选择页
      route({
        type: 'redirectTo',
        url: '/pages/common/role-selection/index',
      });
    }, 500);
  }
  catch (err: any) {
    // 如果后端返回了明确的错误信息，直接展示出来，方便排查
    const message = err?.message || err?.msg || err?.error || '登录失败，请稍后再试';
    console.error('login error', err);
    toast(message);
  }
}

onLoad((options: any) => {
  if (options?.redirect && removeQueryString(options.redirect) !== LOGIN_PATH) {
    redirect = decodeURIComponent(options.redirect);
  }
});

onUnmounted(() => {
  if (timer)
    clearInterval(timer);
});
</script>

<style lang="scss" scoped>
.login-form-wrap {
  @apply mt-80rpx mx-auto mb-0 w-600rpx;

  .title {
    @apply mb-100rpx text-60rpx text-left font-500;
  }

  input,
  :deep(.nut-input) {
    @apply pb-6rpx mb-10rpx text-left;
  }

  .login-btn {
    @apply flex items-center justify-center py-12rpx px-0 text-30rpx bg-#fdf3d0 border-none;
    color: $u-tips-color;

    &::after {
      @apply border-none;
    }
  }
}

.hint {
  @apply px-40rpx py-20rpx text-24rpx;
  color: $u-tips-color;

  .link {
    color: $u-warning;
  }
}
</style>

