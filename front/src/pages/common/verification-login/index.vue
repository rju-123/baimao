<template>
  <view>
    <view class="login-form-wrap">
      <view class="title">
        手机验证码登录
      </view>
      <nut-input v-model="tel" type="number" placeholder="请输入手机号" class="u-border-bottom" />
      <view class="code-row u-border-bottom my-40rpx flex">
        <nut-input v-model="code" type="number" placeholder="请输入验证码" />
        <nut-button type="primary" size="small" :disabled="countdown > 0" @click="getCode">
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
import { CommonApi, PartnerApi } from '@/api';
import { toast, route, test } from '@/utils/uni-helpers';
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
    style.backgroundColor = '#007AFF';
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
    const res: any = await userStore.login({ phone: tel.value, code: code.value });
    toast('登录成功', 'success');
    const userId = Number(userStore.user_id || 0);
    if (userId) {
      try {
        const invoiceRes = await PartnerApi.getInvoiceStatus(userId);
        if (invoiceRes?.status === 'pending' || invoiceRes?.status === 'rejected') {
          setTimeout(() => {
            route({ type: 'redirectTo', url: '/pages/partner/invoice-submission/index' });
          }, 500);
          return;
        }
        if (invoiceRes?.status === 'approved' && invoiceRes?.id) {
          setTimeout(() => {
            route({
              type: 'redirectTo',
              url: `/pages/sales/company-selection/index?companyId=${invoiceRes.id}`,
            });
          }, 500);
          return;
        }
      }
      catch {
        // ignore
      }
    }
    setTimeout(() => {
      // 如果该手机号已存在账号且已选择过公司，则直接进入下单页
      const hasCompany = !!(res?.user?.companyId || userStore.companyId);
      if (hasCompany) {
        route({
          type: 'switchTab',
          url: HOME_PATH,
        });
      }
      else {
        // 否则仍按原流程进入身份选择页，再引导选择公司
        route({
          type: 'redirectTo',
          url: '/pages/common/role-selection/index',
        });
      }
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
    color: var(--theme-text-title);
  }

  input,
  :deep(.nut-input) {
    @apply pb-6rpx mb-10rpx text-left;
    min-height: 120rpx;
    display: flex;
    align-items: center;
  }

  :deep(.nut-input__inner) {
    min-height: 120rpx;
    display: flex;
    align-items: center;
  }

  :deep(.nut-input__input) {
    display: flex;
    align-items: center;
  }

  .code-row {
    gap: 24rpx;
    align-items: stretch;

    :deep(.nut-input) {
      flex: 0 1 65%;
      min-width: 0;
    }

    :deep(.nut-button) {
      flex: 0 1 35%;
      min-height: 120rpx;
      min-width: 0;
      display: flex;
      align-items: center;
      justify-content: center;
      font-size: 20rpx;
      text-align: center;
      background-color: #007AFF !important;
    }

    :deep(.nut-button[disabled]) {
      background-color: #9ca3af !important;
    }

    :deep(.nut-button__wrap) {
      display: flex;
      align-items: center;
      justify-content: center;
      width: 100%;
      font-size: 27rpx;
    }
  }

  :deep(.nut-button) {
    min-height: 120rpx;
  }

  .login-btn {
    @apply flex items-center justify-center py-24rpx px-0 text-30rpx border-none;
    border-radius: var(--theme-btn-radius);
    color: var(--theme-text-subtitle);
    background: #f2f2f7;

    &::after {
      @apply border-none;
    }
  }

  .login-btn[style*='background-color'] {
    color: #fff;
  }
}

.hint {
  @apply px-64rpx py-32rpx text-24rpx;
  color: var(--theme-text-subtitle);

  .link {
    color: #007AFF;
  }
}
</style>

