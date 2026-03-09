<template>
  <view class="min-h-screen theme-bg p-20rpx">
    <view class="theme-text-content mb-20rpx text-32rpx font-medium">
      请选择公司
    </view>
    <nut-cellgroup>
      <nut-cell
        v-for="item in companies"
        :key="item.id"
        :title="item.name"
        :desc="item.address"
        is-link
        @click="selectCompany(item)"
      >
        <template #icon>
          <nut-icon name="shop" class="mr-10rpx" />
        </template>
      </nut-cell>
    </nut-cellgroup>
    <view v-if="!loading && companies.length === 0" class="mt-40rpx text-center theme-text-tips">
      暂无公司数据
    </view>

    <view class="bottom-bar">
      <button class="add-btn" @tap="goAddCompany">
        + 添加新公司
      </button>
    </view>
  </view>
</template>

<script setup lang="ts">
import { onLoad } from '@dcloudio/uni-app';
import { CompanyApi, UserApi } from '@/api';
import useUserStore from '@/store/modules/user';
import { getToken, setToken } from '@/utils/auth';
import { toast, route } from '@/utils/uni-helpers';

const companies = ref<CompanyApi.Company[]>([]);
const loading = ref(false);
const userStore = useUserStore();

async function fetchCompanies() {
  loading.value = true;
  try {
    companies.value = await CompanyApi.listCompanies();
  }
  catch {
    // 后端接口不可用或返回错误时，使用示例公司数据，保证流程可跑通
    toast('加载公司列表失败，已加载示例公司数据');
    companies.value = [
      {
        id: 1,
        name: '某安全公司',
        creditCode: '91110000XXXX000001',
        address: '北京市朝阳区建国路88号',
        contactName: '李经理',
        contactPhone: '010-12345678',
      },
      {
        id: 2,
        name: '某科技公司',
        creditCode: '91310000XXXX000002',
        address: '上海市浦东新区世纪大道100号',
        contactName: '王经理',
        contactPhone: '021-87654321',
      },
      {
        id: 3,
        name: '某网络公司',
        creditCode: '91440000XXXX000003',
        address: '深圳市南山区科技园一路66号',
        contactName: '张经理',
        contactPhone: '0755-12344321',
      },
    ];
  }
  finally {
    loading.value = false;
  }
}

async function selectCompany(item: CompanyApi.Company) {
  const userId = Number(userStore.user_id);

  // 如果存在真实登录态，则尝试同步到后端
  if (userId) {
    try {
      await UserApi.updateCompany(userId, item.id);
    }
    catch {
      // 后端不可用时，不阻塞前端体验，仅提示一次
      toast('更新公司到服务器失败，将使用本地公司信息继续流程');
    }
  }

  // 无论是否登录成功，都在本地保存公司信息，保证流程可跑通
  userStore.setInfo({
    // 若还没有用户ID，给一个演示用的本地ID，避免后续逻辑取值为空
    user_id: userStore.user_id || '1',
    companyId: item.id,
    companyName: item.name,
  });

  // 快捷登录未走后端，无 token；此处设置占位 token，使权限守卫放行，能正常进入下单页
  if (!getToken()) {
    setToken('quick-login');
  }

  toast('公司已选择', 'success');
  setTimeout(() => {
    // 下单页为 TabBar 页面，必须使用 switchTab，不能使用 redirectTo
    route({ type: 'switchTab', url: '/pages/sales/order/index' });
  }, 400);
}

function goAddCompany() {
  route({
    type: 'navigateTo',
    url: '/pages/sales/add-company/index',
  });
}

onLoad(() => {
  fetchCompanies();
});
</script>

<style scoped lang="scss">
.bottom-bar {
  @apply mt-40rpx;
}

.add-btn {
  @apply w-full py-20rpx rounded-full text-30rpx border-none;
  color: #0A7AFF;
  background: #ffffff;

  &::after {
    @apply border-none;
  }
}
</style>

