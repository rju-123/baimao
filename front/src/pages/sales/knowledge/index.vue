<template>
  <view class="page">
    <view class="search-wrapper">
      <view class="search-box">
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
  padding: 32rpx 32rpx 40rpx;
  box-sizing: border-box;
  background: linear-gradient(180deg, var(--theme-bg-gradient-start) 0%, var(--theme-bg-gradient-end) 100%);
}

.search-wrapper {
  margin-bottom: 20rpx;
}

.search-box {
  display: flex;
  align-items: center;
  padding: 24rpx 28rpx;
  border-radius: 24rpx;
  background-color: #f2f2f7;
}

.search-input {
  flex: 1;
  font-size: 26rpx;
}

.search-btn {
  margin-left: 12rpx;
  padding: 8rpx 24rpx;
  border-radius: var(--theme-btn-radius);
  border: none;
  font-size: 24rpx;
  color: #ffffff;
  background-color: #007AFF;
}

.list {
  height: calc(100vh - 140rpx);
}

.article-card {
  padding: 28rpx 32rpx;
  margin-bottom: 20rpx;
  border-radius: var(--theme-card-radius);
  background-color: #ffffff;
  box-shadow: var(--theme-card-shadow);
}

.article-title {
  font-size: 30rpx;
  font-weight: 600;
  color: var(--theme-text-title);
  margin-bottom: 8rpx;
}

.article-summary {
  font-size: 24rpx;
  color: var(--theme-text-subtitle);
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

