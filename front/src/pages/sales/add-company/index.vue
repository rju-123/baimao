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
import { getToken, setToken } from '@/utils/auth';

const userStore = useUserStore();

const form = reactive<CompanyApi.CreateCompanyDto>({
  name: '',
  creditCode: '',
  address: '',
  contactName: '',
  contactPhone: '',
});

function normalizeCompanyName(name: string): string {
  return String(name || '').trim().toLowerCase();
}

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
    // 若同名公司已存在：不重复创建，直接提示并绑定到该公司
    const inputName = normalizeCompanyName(form.name);
    if (inputName) {
      try {
        const exists = await CompanyApi.listCompanies();
        const found = (Array.isArray(exists) ? exists : []).find(c => normalizeCompanyName(c.name) === inputName);
        if (found?.id) {
          toast('该公司已创建，请返回选择该公司', 'none');

          const userId = Number(userStore.user_id);
          if (userId) {
            try {
              await UserApi.updateCompany(userId, found.id);
            } catch {
              console.warn('update user company failed after company exists');
            }
          }

          userStore.setInfo({
            companyId: found.id,
            companyName: found.name,
          });

          if (!getToken())
            setToken('quick-login');

          setTimeout(() => {
            route({
              type: 'switchTab',
              url: '/pages/sales/order/index',
            });
          }, 300);
          return;
        }
      } catch {
        // ignore: 拉取公司列表失败时继续走创建流程
      }
    }

    const created = await CompanyApi.createCompany(form);
    toast('公司已创建', 'success');

    const userId = Number(userStore.user_id);
    if (userId && created?.id) {
      try {
        await UserApi.updateCompany(userId, created.id);
      }
      catch {
        // 如果更新用户公司失败，不阻塞后续跳转
        console.warn('update user company failed after create company');
      }
      // 无论后端同步是否成功，都先在前端落一份公司信息
      userStore.setInfo({
        companyId: created.id,
        companyName: created.name,
      });
    }

    // 兜底：确保跳转到 TabBar 页面时通过权限拦截（permission 依赖 admin-token）
    if (!getToken())
      setToken('quick-login');

    setTimeout(() => {
      route({
        type: 'switchTab',
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
  @apply min-h-screen px-64rpx pt-48rpx pb-48rpx;
  background: linear-gradient(180deg, var(--theme-bg-gradient-start) 0%, var(--theme-bg-gradient-end) 100%);
}

.form {
  @apply px-40rpx pt-32rpx pb-24rpx mb-48rpx;
  border-radius: var(--theme-card-radius);
  background: #ffffff;
  box-shadow: var(--theme-card-shadow);
}

.label {
  @apply mt-20rpx mb-10rpx text-26rpx;
  color: var(--theme-text-title);
}

.bottom-bar {
  @apply mt-24rpx;
}

.submit-btn {
  @apply w-full py-24rpx text-30rpx border-none;
  border-radius: var(--theme-btn-radius);
  color: #ffffff;
  background: #007AFF;

  &::after {
    @apply border-none;
  }
}
</style>

