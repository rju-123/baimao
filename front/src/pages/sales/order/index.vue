<template>
  <view class="page">
    <view class="top-bar">
      <view class="tabs-wrapper">
        <nut-tabs v-model="activeTab" type="smile">
          <nut-tabpane title="全部" pane-key="all" />
          <nut-tabpane title="红队检测" pane-key="redteam" />
          <nut-tabpane title="渗透测试" pane-key="pentest" />
          <nut-tabpane title="其他产品" pane-key="other" />
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
            placeholder="搜索产品"
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
          <view class="card-inner" :class="{ 'card-inner-soldout': isSoldOut(item) }">
            <view class="card-header">
              <view class="card-title">
                {{ item.name }}
              </view>
              <view v-if="typeLabel(item.type)" class="type-tag" :class="`type-${item.type}`">
                {{ typeLabel(item.type) }}
              </view>
              <view class="card-actions">
                <view v-if="isSoldOut(item)" class="soldout-tag">
                  已售罄
                </view>
                <button class="card-btn" :class="{ disabled: isSoldOut(item) }" @tap="goDetail(item)">
                  {{ isSoldOut(item) ? '不可下单' : '立即下单' }}
                </button>
              </view>
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
const activeTab = ref<'all' | 'redteam' | 'pentest' | 'other'>('all');
const keyword = ref('');

function typeLabel(type: string | null | undefined): string {
  const t = String(type || '').trim();
  if (t === 'redteam') return '红队检测';
  if (t === 'pentest') return '渗透测试';
  if (t === 'other') return '其他产品';
  return '';
}

const filteredProducts = computed(() => {
  let list = Array.isArray(products.value) ? products.value : [];
  if (activeTab.value !== 'all')
    list = list.filter(item => item.type === activeTab.value);
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

function isSoldOut(item: ProductApi.Product): boolean {
  const inventory = Number(item.inventory ?? 0);
  return inventory <= 0;
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
  if (isSoldOut(item)) {
    toast('当前产品已售罄，暂不可下单');
    return;
  }
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
  background: linear-gradient(180deg, var(--theme-bg-gradient-start) 0%, var(--theme-bg-gradient-end) 100%);
  display: flex;
  flex-direction: column;
}

.top-bar {
  background-color: #ffffff;
  border-bottom: 1rpx solid #ededed;
}

.tabs-wrapper {
  padding: 10rpx 32rpx 8rpx;
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
  padding: 0 32rpx 32rpx;
  box-sizing: border-box;
}

.search-wrapper {
  margin-top: 0;
  margin-bottom: 20rpx;
}

.search-box {
  display: flex;
  align-items: center;
  padding: 28rpx 24rpx;
  border-radius: 24rpx;
  background: #f2f2f7;
}

.search-icon {
  margin-right: 12rpx;
  font-size: 26rpx;
  color: var(--theme-text-subtitle);
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
  padding: 28rpx 32rpx 32rpx;
  border-radius: var(--theme-card-radius);
  box-sizing: border-box;
  background-color: #ffffff;
  box-shadow: var(--theme-card-shadow);
}

.card-inner-soldout {
  opacity: 0.6;
}

.card-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 8rpx;
  gap: 20rpx;
}

.card-actions {
  display: flex;
  align-items: center;
  gap: 12rpx;
}

.card-title {
  flex: 1;
  min-width: 0;
  font-size: 30rpx;
  font-weight: 600;
  overflow: hidden;
  white-space: nowrap;
  text-overflow: ellipsis;
  color: var(--theme-text-title);
}

.type-tag {
  flex-shrink: 0;
  padding: 4rpx 12rpx;
  border-radius: 9999rpx;
  font-size: 22rpx;
  font-weight: 500;
  color: #374151;
  background: #f3f4f6;
}

.type-redteam {
  color: #1d4ed8;
  background: rgba(29, 78, 216, 0.12);
}

.type-pentest {
  color: #b45309;
  background: rgba(180, 83, 9, 0.12);
}

.type-other {
  color: #4b5563;
  background: rgba(75, 85, 99, 0.12);
}

.card-btn {
  flex-shrink: 0;
  width: 144rpx;
  margin-right: 16rpx;
  padding: 8rpx 0;
  border-radius: var(--theme-btn-radius);
  font-size: 24rpx;
  border: none;
  text-align: center;
  color: #ffffff;
  background-color: #007AFF;

  &::after {
    border: none;
  }
}

.card-btn.disabled {
  background-color: #9ca3af;
}

.soldout-tag {
  flex-shrink: 0;
  padding: 4rpx 10rpx;
  border-radius: 9999rpx;
  font-size: 22rpx;
  color: #b91c1c;
  background-color: #fee2e2;
}

.card-brief {
  margin-top: 4rpx;
  font-size: 26rpx;
  color: var(--theme-text-subtitle);
}

.card-price-row {
  margin-top: 12rpx;
  display: flex;
  align-items: center;
}

.card-origin-price {
  margin-right: 12rpx;
  font-size: 24rpx;
  color: var(--theme-text-subtitle);
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
  color: var(--theme-text-subtitle);
}
</style>

