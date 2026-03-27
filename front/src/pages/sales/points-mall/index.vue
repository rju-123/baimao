<template>
  <view class="points-page">
    <!-- 积分余额卡片 -->
    <view class="points-card">
      <view class="points-card-header">
        <view class="title">我的积分</view>
        <view class="subtitle">完成订单获得积分</view>
      </view>
      <view class="points-value">
        {{ pointsDisplay }}
      </view>
    </view>

    <!-- 商品类型分段控件 -->
    <view class="segment-wrapper">
      <nut-tabs v-model="activeTab" type="line" color="#007AFF">
        <nut-tabpane title="全部" pane-key="all" />
        <nut-tabpane title="实体商品" pane-key="physical" />
        <nut-tabpane title="虚拟商品" pane-key="virtual" />
      </nut-tabs>
    </view>

    <!-- 商品列表（跟随整页一起滚动） -->
    <view class="goods-list">
      <view v-if="loading" class="empty">
        加载中...
      </view>
      <view v-else-if="filteredItems.length === 0" class="empty">
        暂无可兑换商品
      </view>
      <view v-else class="goods-grid">
        <view
          v-for="item in filteredItems"
          :key="item.id"
          class="goods-item"
        >
          <view class="goods-card">
            <view class="goods-image">
              <image
                v-if="item.image"
                class="goods-img"
                :src="fullImageUrl(item.image)"
                mode="aspectFill"
              />
              <text v-else class="emoji">
                {{ item.type === 'physical' ? '📦' : '🎫' }}
              </text>
            </view>
            <view class="goods-name">
              {{ item.name }}
            </view>
            <view class="goods-points">
              {{ item.pointsRequired }} 积分
            </view>
            <view class="goods-meta">
              <text class="stock">
                库存 {{ item.stock }}
              </text>
              <text class="tag" :class="item.type === 'physical' ? 'tag-physical' : 'tag-virtual'">
                {{ item.type === 'physical' ? '实体' : '虚拟' }}
              </text>
            </view>
            <view class="goods-actions">
              <nut-button
                type="primary"
                size="small"
                :disabled="item.stock <= 0"
                @click="goExchange(item)"
              >
                立即兑换
              </nut-button>
            </view>
          </view>
        </view>
      </view>
    </view>
  </view>
</template>

<script setup lang="ts">
import { onMounted, ref, watch } from 'vue';
import { onShow } from '@dcloudio/uni-app';
import { PointsApi, UserApi } from '@/api';
import useUserStore from '@/store/modules/user';
import type { PointsMallItem } from '@/api/points';

const userStore = useUserStore();

const loading = ref(false);
const items = ref<PointsMallItem[]>([]);
const activeTab = ref<'all' | 'physical' | 'virtual'>('all');

// 使用 ref + watch，确保从后端刷新积分后界面一定更新
const pointsDisplay = ref<number>(userStore.points ?? 0);
watch(
  () => userStore.points,
  (val) => {
    pointsDisplay.value = val ?? 0;
  },
  { immediate: true },
);

const filteredItems = computed(() => {
  if (activeTab.value === 'all')
    return items.value;
  return items.value.filter(item => item.type === activeTab.value);
});

const fullImageUrl = (path?: string) => {
  if (!path)
    return '';
  // 已经是完整 URL，直接返回
  if (path.startsWith('http'))
    return path;

  // 后台 FastAdmin 上传路径通常类似 /uploads/xxxx/xxx.jpg
  // 静态文件由 PHP 站点（如 http://127.0.0.1:8000）提供，而不是 NestJS 3000 端口
  const fileBase = import.meta.env.VITE_FILE_BASE_URL || 'http://127.0.0.1:8000';
  return `${fileBase.replace(/\/$/, '')}${path}`;
};

const fetchItems = async () => {
  loading.value = true;
  try {
    const data = await PointsApi.listMallItems();
    items.value = Array.isArray(data) ? data : [];
  }
  catch (err) {
    console.error('load mall items error', err);
    items.value = [];
    uni.showToast({
      title: '加载积分商品失败',
      icon: 'none',
    });
  }
  finally {
    loading.value = false;
  }
};

const goExchange = (item: PointsMallItem) => {
  const userId = Number(userStore.user_id || 0);
  if (!userId) {
    uni.showToast({ title: '请先登录', icon: 'none' });
    return;
  }
  uni.navigateTo({
    url: `/pages/sales/exchange-confirm/index?itemId=${item.id}`,
  });
};

// 进入页面时加载商品
onMounted(() => {
  fetchItems();
});

// 每次进入页面时，直接从后端读取最新积分并同步到本地 store
onShow(async () => {
  const id = Number(userStore.user_id || 0);
  if (!id)
    return;
  try {
    const user = await UserApi.getUser(id);
    const pts = user.points ?? 0;
    userStore.setInfo({ points: pts });
    pointsDisplay.value = pts;
  }
  catch (e) {
    console.warn('load points failed', e);
  }
});
</script>

<style scoped lang="scss">
.points-page {
  min-height: 100vh;
  padding: 32rpx;
  box-sizing: border-box;
  background: linear-gradient(180deg, var(--theme-bg-gradient-start) 0%, var(--theme-bg-gradient-end) 100%);
}

.points-card {
  padding: 32rpx 40rpx;
  border-radius: var(--theme-card-radius);
  background: #007AFF;
  color: #ffffff;
  margin-bottom: 28rpx;
  box-shadow: var(--theme-card-shadow);
}

.points-card-header {
  .title {
    font-size: 30rpx;
    font-weight: 600;
  }

  .subtitle {
    margin-top: 8rpx;
    font-size: 22rpx;
    opacity: 0.9;
  }
}

.points-value {
  margin-top: 16rpx;
  font-size: 40rpx;
  font-weight: 700;
}

.segment-wrapper {
  margin-bottom: 8rpx;
}

/* 仅使用 NutTabs 的标题做筛选，不需要内容区域，隐藏默认白色内容容器，去掉下方白条 */
.segment-wrapper :deep(.nut-tabs__content) {
  display: none;
}

.goods-grid {
  display: grid;
  grid-template-columns: repeat(2, minmax(0, 1fr));
  grid-gap: 16rpx;
}

.goods-item {
  width: 100%;
}

.goods-card {
  background-color: #ffffff;
  border-radius: var(--theme-card-radius);
  padding: 20rpx;
  box-sizing: border-box;
  display: flex;
  flex-direction: column;
  gap: 8rpx;
  box-shadow: var(--theme-card-shadow);
}

.goods-image {
  position: relative;
  width: 100%;
  /* 利用 padding-top 100% 实现 1:1 方图占位 */
  padding-top: 100%;
  border-radius: 12rpx;
  overflow: hidden;
  background-color: #f5f5f7;
}

.goods-img {
  position: absolute;
  left: 0;
  top: 0;
  width: 100%;
  height: 100%;
  border-radius: 12rpx;
  object-fit: cover;
}

.goods-image .emoji {
  position: absolute;
  left: 50%;
  top: 50%;
  transform: translate(-50%, -50%);
  font-size: 60rpx;
}

.goods-name {
  font-size: 26rpx;
  font-weight: 500;
  color: #000000;
  min-height: 72rpx;
}

.goods-points {
  font-size: 24rpx;
  color: #ff9500;
}

.goods-meta {
  display: flex;
  justify-content: space-between;
  align-items: center;
  font-size: 22rpx;

  .stock {
    color: #8e8e93;
  }

  .tag {
    padding: 2rpx 10rpx;
    border-radius: 999rpx;
    font-size: 20rpx;
    color: #ffffff;
  }

  .tag-physical {
    background-color: #007AFF;
  }

  .tag-virtual {
    background-color: #34c759;
  }
}

.goods-actions {
  margin-top: 8rpx;
  display: flex;
  justify-content: flex-end;
}

.empty {
  padding: 48rpx 0;
  text-align: center;
  color: #8e8e93;
  font-size: 24rpx;
}
</style>

