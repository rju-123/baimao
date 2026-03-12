<template>
  <view class="page">
    <view class="top-bar">
      <view class="tabs-wrapper">
        <nut-tabs v-model="activeTab" type="smile">
          <nut-tabpane title="全部" pane-key="all" />
          <nut-tabpane title="产品" pane-key="product" />
          <nut-tabpane title="服务" pane-key="service" />
        </nut-tabs>
      </view>
    </view>

    <view class="content">
      <view class="search-wrapper">
        <view class="search-box">
          <text class="search-icon">🔍</text>
          <input
            v-model="keyword"
            class="search-input"
            type="text"
            placeholder="搜索产品或服务"
            confirm-type="search"
          />
        </view>
      </view>

      <scroll-view scroll-y class="list-wrapper">
        <view
          v-for="item in displayedProducts"
          :key="item.id"
          class="card"
        >
          <view class="card-inner">
            <view class="card-header">
              <view class="card-title">
                {{ item.name }}
              </view>
              <button class="card-btn" @tap="goDetail(item)">
                立即下单
              </button>
            </view>
            <view class="card-brief">
              {{ item.brief }}
            </view>
            <view class="card-price-row">
              <text
                v-if="item.discountPrice != null"
                class="card-origin-price"
              >
                ￥{{ formatPrice(item.price) }}
              </text>
              <text class="card-price">
                ￥{{ formatPrice(item.discountPrice ?? item.price) }}
              </text>
            </view>
          </view>
        </view>

        <view
          v-if="!loading && displayedProducts.length === 0"
          class="empty-text"
        >
          暂无产品
        </view>
      </scroll-view>
    </view>
  </view>
</template>

<script setup lang="ts">
import { onLoad, onShow } from '@dcloudio/uni-app';
import { ProductApi } from '@/api';
import { toast, route } from '@/utils/uni-helpers';

const products = ref<ProductApi.Product[]>([]);
const loading = ref(false);
const activeTab = ref<'all' | 'service' | 'product'>('all');
const keyword = ref('');

const filteredProducts = computed(() => {
  let list = Array.isArray(products.value) ? products.value : [];
  if (activeTab.value === 'service')
    list = list.filter(item => item.type === 'service');
  else if (activeTab.value === 'product')
    list = list.filter(item => item.type === 'product');
  return list;
});

const displayedProducts = computed(() => {
  const kw = keyword.value.trim();
  if (!kw)
    return filteredProducts.value;
  return filteredProducts.value.filter(item =>
    (item.name || '').includes(kw) || (item.brief || '').includes(kw),
  );
});

/** 兼容后端 decimal 可能返回字符串的情况，统一转为数字再格式化 */
function formatPrice(val: number | string | null | undefined): string {
  const n = Number(val);
  return Number.isNaN(n) ? '0' : n.toFixed(0);
}

async function fetchProducts() {
  loading.value = true;
  try {
    const list = await ProductApi.listProducts();
    products.value = Array.isArray(list) ? list : [];
  }
  catch {
    toast('加载产品失败');
    products.value = [];
  }
  finally {
    loading.value = false;
  }
}

function goDetail(item: ProductApi.Product) {
  route({
    type: 'navigateTo',
    url: `/pages/sales/product-detail/index?id=${item.id}`,
  });
}

onLoad(() => {
  fetchProducts();
});

onShow(() => {
  // 每次进入下单页时刷新产品列表，避免已售罄/下架的产品继续展示
  fetchProducts();
});
</script>

<style scoped lang="scss">
.page {
  min-height: 100vh;
  background-color: #f7f8fa;
  display: flex;
  flex-direction: column;
}

.top-bar {
  background-color: #ffffff;
  border-bottom: 1rpx solid #ededed;
}

.tabs-wrapper {
  padding: 10rpx 24rpx 8rpx;
}

/* 隐藏 nut-tabs 默认的内容区域，只保留标签头部，去掉下面那块白条 */
:deep(.nut-tabs__content),
:deep(.nut-tabs__content-inner) {
  display: none;
  padding: 0;
  margin: 0;
  height: 0;
}

.content {
  flex: 1;
  display: flex;
  flex-direction: column;
  /* 去掉顶部内边距，让搜索框紧贴标签区域下方 */
  padding: 0 24rpx 24rpx;
  box-sizing: border-box;
}

.search-wrapper {
  /* 删除与标签之间的额外留白 */
  margin-top: 0;
  margin-bottom: 16rpx;
}

.search-box {
  display: flex;
  align-items: center;
  padding: 26rpx 20rpx;
  border-radius: 9999rpx;
  background: #f2f2f7;
}

.search-icon {
  margin-right: 12rpx;
  font-size: 26rpx;
  color: #8e8e93;
}

.search-input {
  flex: 1;
  font-size: 26rpx;
}

.list-wrapper {
  flex: 1;
  box-sizing: border-box;
}

.card {
  margin-bottom: 16rpx;
}

.card-inner {
  padding: 24rpx 24rpx 28rpx;
  border-radius: 16rpx;
  box-sizing: border-box;
  background-color: #ffffff;
  border: 2rpx solid #c4c8d6;
  box-shadow: 0 4rpx 8rpx rgba(0, 0, 0, 0.03);
}

.card-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 8rpx;
  gap: 20rpx;
}

.card-title {
  flex: 1;
  min-width: 0;
  font-size: 30rpx;
  font-weight: 600;
  overflow: hidden;
  white-space: nowrap;
  text-overflow: ellipsis;
  color: #1b233b;
}

.card-btn {
  flex-shrink: 0;
  width: 144rpx;
  margin-right: 16rpx;
  padding: 8rpx 0;
  border-radius: 9999rpx;
  font-size: 24rpx;
  border: none;
  text-align: center;
  color: #ffffff;
  background-color: #0A7AFF;

  &::after {
    border: none;
  }
}

.card-brief {
  margin-top: 4rpx;
  font-size: 26rpx;
  color: #8e8e93;
}

.card-price-row {
  margin-top: 12rpx;
  display: flex;
  align-items: center;
}

.card-origin-price {
  margin-right: 12rpx;
  font-size: 24rpx;
  color: #8e8e93;
  text-decoration: line-through;
}

.card-price {
  font-size: 30rpx;
  font-weight: 600;
  color: #ff3b30;
}

.empty-text {
  margin-top: 40rpx;
  text-align: center;
  font-size: 26rpx;
  color: #8e8e93;
}
</style>

