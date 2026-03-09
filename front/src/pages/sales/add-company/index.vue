<template>
  <view class="page">
    <view class="form">
      <view class="label">
        公司名称
      </view>
      <nut-input v-model="form.name" placeholder="请输入公司名称" />

      <view class="label">
        统一社会信用代码
      </view>
      <nut-input v-model="form.creditCode" placeholder="请输入统一社会信用代码" />

      <view class="label">
        公司地址
      </view>
      <nut-input v-model="form.address" placeholder="请输入公司地址" />

      <view class="label">
        联系人姓名
      </view>
      <nut-input v-model="form.contactName" placeholder="请输入联系人姓名" />

      <view class="label">
        联系人电话
      </view>
      <nut-input v-model="form.contactPhone" type="number" placeholder="请输入联系人电话" />
    </view>

    <view class="bottom-bar">
      <button class="submit-btn" @tap="submit">
        保存并返回
      </button>
    </view>
  </view>
</template>

<script setup lang="ts">
import { CompanyApi, UserApi } from '@/api';
import useUserStore from '@/store/modules/user';
import { toast, route } from '@/utils/uni-helpers';

const userStore = useUserStore();

const form = reactive<CompanyApi.CreateCompanyDto>({
  name: '',
  creditCode: '',
  address: '',
  contactName: '',
  contactPhone: '',
});

async function submit() {
  if (!form.name) {
    toast('请输入公司名称');
    return;
  }
  if (!form.creditCode) {
    toast('请输入统一社会信用代码');
    return;
  }
  if (!form.address) {
    toast('请输入公司地址');
    return;
  }
  if (!form.contactName) {
    toast('请输入联系人姓名');
    return;
  }
  // 联系人电话这里既允许手机号，也允许座机，所以放宽校验规则：
  // 去掉非数字字符后至少 7 位即可
  const pureDigits = String(form.contactPhone || '').replace(/\\D/g, '');
  if (!pureDigits || pureDigits.length < 7) {
    toast('请输入正确的联系人电话');
    return;
  }
  try {
    const created = await CompanyApi.createCompany(form);
    toast('公司已创建', 'success');

    const userId = Number(userStore.user_id);
    if (userId && created?.id) {
      try {
        await UserApi.updateCompany(userId, created.id);
        userStore.setInfo({
          companyId: created.id,
          companyName: created.name,
        });
      }
      catch {
        // 如果更新用户公司失败，不阻塞后续跳转
        console.warn('update user company failed after create company');
      }
    }

    setTimeout(() => {
      route({
        type: 'redirectTo',
        url: '/pages/sales/order/index',
      });
    }, 400);
  }
  catch {
    toast('创建公司失败，请稍后重试');
  }
}
</script>

<style scoped lang="scss">
.page {
  @apply min-h-screen px-40rpx pt-40rpx pb-40rpx;
  background: #f7f8fa;
}

.form {
  @apply px-24rpx pt-24rpx pb-16rpx mb-40rpx rounded-24rpx;
  background: #ffffff;
}

.label {
  @apply mt-16rpx mb-8rpx text-26rpx;
  color: #1b233b;
}

.bottom-bar {
  @apply mt-20rpx;
}

.submit-btn {
  @apply w-full py-20rpx rounded-full text-30rpx border-none;
  color: #ffffff;
  background-image: linear-gradient(90deg, #0A7AFF, #21d59d);

  &::after {
    @apply border-none;
  }
}
</style>

