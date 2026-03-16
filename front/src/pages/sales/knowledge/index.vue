<template>
  <view class="page">
    <view class="search-wrapper">
      <view class="search-box">
        <text class="search-icon">🔍</text>
        <input
          v-model="keyword"
          class="search-input"
          type="text"
          placeholder="搜索文章"
          confirm-type="search"
          @confirm="onSearch"
        />
        <button class="search-btn" @tap="onSearch">
          搜索
        </button>
      </view>
    </view>

    <scroll-view
      scroll-y
      class="list"
      @scrolltolower="onReachBottom"
      @refresherrefresh="onPullDown"
      refresher-enabled
      :refresher-triggered="refreshing"
    >
      <view
        v-for="item in list"
        :key="item.id"
        class="article-card"
        @tap="goDetail(item)"
      >
        <view class="article-title">
          {{ item.title }}
        </view>
        <view class="article-summary">
          {{ item.summary }}
        </view>
      </view>

      <view v-if="!loading && list.length === 0" class="empty">
        暂无文章
      </view>
      <view v-if="loading" class="loading">
        加载中...
      </view>
    </scroll-view>
  </view>
</template>

<script setup lang="ts">
import { onShow } from '@dcloudio/uni-app';
import { ref } from 'vue';
import { KnowledgeApi } from '@/api';
import type { KnowledgeArticleListItem } from '@/api/knowledge';

const keyword = ref('');
const list = ref<KnowledgeArticleListItem[]>([]);
const page = ref(1);
const pageSize = ref(10);
const total = ref(0);
const loading = ref(false);
const refreshing = ref(false);

const fetchList = async (reset = false) => {
  if (loading.value)
    return;
  if (reset) {
    page.value = 1;
    list.value = [];
  }
  loading.value = true;
  try {
    const res = await KnowledgeApi.listKnowledgeArticles({
      keyword: keyword.value.trim() || undefined,
      page: page.value,
      pageSize: pageSize.value,
    });
    total.value = res.total;
    const rows = Array.isArray(res.list) ? res.list : [];
    if (page.value === 1)
      list.value = rows;
    else
      list.value = list.value.concat(rows);
  }
  catch (e) {
    console.error('load knowledge list error', e);
    uni.showToast({
      title: '加载文章失败',
      icon: 'none',
    });
  }
  finally {
    loading.value = false;
    refreshing.value = false;
  }
};

const onSearch = () => {
  fetchList(true);
};

const onPullDown = () => {
  refreshing.value = true;
  fetchList(true);
};

const onReachBottom = () => {
  if (list.value.length >= total.value)
    return;
  page.value += 1;
  fetchList(false);
};

const goDetail = (item: KnowledgeArticleListItem) => {
  uni.navigateTo({
    url: `/pages/sales/knowledge/detail?id=${item.id}`,
  });
};

onShow(() => {
  if (!list.value.length)
    fetchList(true);
});
</script>

<style scoped lang="scss">
.page {
  min-height: 100vh;
  padding: 24rpx 24rpx 32rpx;
  box-sizing: border-box;
  background-color: #f7f8fa;
}

.search-wrapper {
  margin-bottom: 16rpx;
}

.search-box {
  display: flex;
  align-items: center;
  padding: 20rpx 24rpx;
  border-radius: 9999rpx;
  background-color: #f2f2f7;
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

.search-btn {
  margin-left: 12rpx;
  padding: 6rpx 20rpx;
  border-radius: 9999rpx;
  border: none;
  font-size: 24rpx;
  color: #ffffff;
  background-color: #0a7aff;
}

.list {
  height: calc(100vh - 140rpx);
}

.article-card {
  padding: 20rpx 24rpx;
  margin-bottom: 16rpx;
  border-radius: 20rpx;
  background-color: #ffffff;
  box-shadow: 0 4rpx 12rpx rgba(15, 23, 42, 0.04);
}

.article-title {
  font-size: 30rpx;
  font-weight: 600;
  color: #111827;
  margin-bottom: 8rpx;
}

.article-summary {
  font-size: 24rpx;
  color: #6b7280;
}

.empty {
  margin-top: 40rpx;
  text-align: center;
  font-size: 26rpx;
  color: #9ca3af;
}

.loading {
  margin-top: 20rpx;
  text-align: center;
  font-size: 24rpx;
  color: #9ca3af;
}
</style>

