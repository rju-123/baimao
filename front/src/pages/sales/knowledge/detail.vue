<template>
  <view class="page" v-if="article">
    <view class="title">
      {{ article.title }}
    </view>
    <view class="meta">
      <text class="summary">
        {{ article.summary }}
      </text>
    </view>

    <!-- 头部附件区域（如果附件位置为 head） -->
    <view
      v-if="showAttachmentHead && attachments.length"
      class="attachment-section"
    >
      <view class="attachment-header">
        <text class="attachment-header-icon">📎</text>
        <text class="attachment-header-title">
          相关附件
        </text>
        <text class="attachment-header-count">
          （{{ attachments.length }}）
        </text>
      </view>

      <view class="attachment-list">
        <view
          v-for="(item, index) in attachments"
          :key="index"
          class="attachment-card"
          @tap="openAttachment(item)"
        >
          <view
            class="attachment-card-icon"
            :class="`attachment-card-icon--${item.type}`"
          >
            <text class="attachment-card-icon-text">
              {{ item.typeLabel }}
            </text>
          </view>
          <view class="attachment-card-main">
            <view class="attachment-card-name">
              {{ item.name }}
            </view>
            <view class="attachment-card-meta">
              <text class="attachment-card-size">
                {{ item.sizeText }}
              </text>
              <text v-if="item.sizeText" class="attachment-card-dot">·</text>
              <text class="attachment-card-ext">
                {{ item.ext.toUpperCase() }}
              </text>
            </view>
          </view>
          <view class="attachment-card-action">
            <text class="attachment-card-download">⬇️</text>
          </view>
        </view>
      </view>
    </view>

    <view class="content">
      <rich-text :nodes="article.content" />
    </view>

    <!-- 底部附件区域（如果附件位置为 tail） -->
    <view
      v-if="showAttachmentTail && attachments.length"
      class="attachment-section attachment-section--tail"
    >
      <view class="attachment-header">
        <text class="attachment-header-icon">📎</text>
        <text class="attachment-header-title">
          相关附件
        </text>
        <text class="attachment-header-count">
          （{{ attachments.length }}）
        </text>
      </view>

      <view class="attachment-list">
        <view
          v-for="(item, index) in attachments"
          :key="index"
          class="attachment-card"
          @tap="openAttachment(item)"
        >
          <view
            class="attachment-card-icon"
            :class="`attachment-card-icon--${item.type}`"
          >
            <text class="attachment-card-icon-text">
              {{ item.typeLabel }}
            </text>
          </view>
          <view class="attachment-card-main">
            <view class="attachment-card-name">
              {{ item.name }}
            </view>
            <view class="attachment-card-meta">
              <text class="attachment-card-size">
                {{ item.sizeText }}
              </text>
              <text v-if="item.sizeText" class="attachment-card-dot">·</text>
              <text class="attachment-card-ext">
                {{ item.ext.toUpperCase() }}
              </text>
            </view>
          </view>
          <view class="attachment-card-action">
            <text class="attachment-card-download">⬇️</text>
          </view>
        </view>
      </view>
    </view>
  </view>
  <view v-else class="page error">
    <view class="error-text">
      文章已下架或不存在
    </view>
  </view>
</template>

<script setup lang="ts">
import { onLoad } from '@dcloudio/uni-app';
import { computed, ref } from 'vue';
import { KnowledgeApi } from '@/api';
import type { KnowledgeArticleDetail } from '@/api/knowledge';

const article = ref<KnowledgeArticleDetail | null>(null);

type AttachmentType = 'pdf' | 'doc' | 'image' | 'other';

interface AttachmentItem {
  url: string;
  name: string;
  ext: string;
  type: AttachmentType;
  typeLabel: string;
  sizeText: string;
}

const showAttachmentHead = computed(() => {
  return !!article.value?.attachmentUrl && article.value?.attachmentPosition === 'head';
});

const showAttachmentTail = computed(() => {
  return !!article.value?.attachmentUrl && article.value?.attachmentPosition === 'tail';
});

const attachments = computed<AttachmentItem[]>(() => {
  if (!article.value?.attachmentUrl)
    return [];

  const urls = article.value.attachmentUrl.split(',')
    .map(item => item.trim())
    .filter(Boolean);

  const namesRaw = (article.value.attachmentName || '').split(',')
    .map(item => item.trim());

  return urls.map((url, index) => {
    const rawName = namesRaw[index] || decodeURIComponent(url.split('/').pop() || '附件');
    const ext = (rawName.split('.').pop() || '').toLowerCase();

    let type: AttachmentType = 'other';
    let typeLabel = 'FILE';
    if (ext === 'pdf') {
      type = 'pdf';
      typeLabel = 'PDF';
    } else if (ext === 'doc' || ext === 'docx') {
      type = 'doc';
      typeLabel = 'DOC';
    } else if (['png', 'jpg', 'jpeg', 'gif', 'webp', 'bmp'].includes(ext)) {
      type = 'image';
      typeLabel = 'IMG';
    }

    // 当前接口未返回文件大小，这里先留空占位
    const sizeText = '';

    return {
      url,
      name: rawName,
      ext,
      type,
      typeLabel,
      sizeText,
    };
  });
});

const openAttachment = (item: AttachmentItem) => {
  const url = item.url;
  if (!url)
    return;

  uni.downloadFile({
    url,
    success(res) {
      const filePath = res.tempFilePath;
      uni.openDocument({
        filePath,
        showMenu: true,
        fail() {
          uni.setClipboardData({
            data: url,
            success() {
              uni.showToast({
                title: '已复制附件链接，可在浏览器中打开',
                icon: 'none',
              });
            },
          });
        },
      });
    },
    fail() {
      uni.setClipboardData({
        data: url,
        success() {
          uni.showToast({
            title: '已复制附件链接，可在浏览器中打开',
            icon: 'none',
          });
        },
      });
    },
  });
};

onLoad(async (options: any) => {
  const id = Number(options?.id);
  if (!id) {
    uni.showToast({
      title: '参数错误',
      icon: 'none',
    });
    return;
  }
  try {
    const res = await KnowledgeApi.getKnowledgeArticle(id);
    if (!res) {
      article.value = null;
      return;
    }
    article.value = res;
  }
  catch (e) {
    console.error('load article detail error', e);
    article.value = null;
  }
});
</script>

<style scoped lang="scss">
.page {
  min-height: 100vh;
  padding: 24rpx 24rpx 40rpx;
  box-sizing: border-box;
  background-color: #f7f8fa;
}

.title {
  font-size: 34rpx;
  font-weight: 600;
  color: #111827;
  margin-bottom: 12rpx;
}

.meta {
  margin-bottom: 20rpx;
}

.summary {
  font-size: 24rpx;
  color: #6b7280;
}

.content {
  padding: 20rpx 16rpx;
  border-radius: 20rpx;
  background-color: #ffffff;
}

.attachment-section {
  margin-top: 24rpx;
}

.attachment-section--tail {
  margin-top: 32rpx;
}

.attachment-header {
  display: flex;
  align-items: center;
  margin-bottom: 12rpx;
}

.attachment-header-icon {
  font-size: 26rpx;
  margin-right: 8rpx;
}

.attachment-header-title {
  font-size: 26rpx;
  font-weight: 600;
  color: #111827;
}

.attachment-header-count {
  font-size: 24rpx;
  color: #6b7280;
}

.attachment-list {
  display: flex;
  flex-direction: column;
  gap: 16rpx;
}

.attachment-card {
  display: flex;
  align-items: center;
  padding: 20rpx 24rpx;
  border-radius: 24rpx;
  background-color: #ffffff;
  box-shadow: 0 8rpx 24rpx rgba(15, 23, 42, 0.06);
}

.attachment-card-icon {
  width: 76rpx;
  height: 76rpx;
  border-radius: 22rpx;
  display: flex;
  align-items: center;
  justify-content: center;
  margin-right: 20rpx;
}

.attachment-card-icon-text {
  font-size: 22rpx;
  font-weight: 600;
  color: #ffffff;
}

.attachment-card-icon--pdf {
  background: linear-gradient(135deg, #fee2e2, #f97373);
}

.attachment-card-icon--doc {
  background: linear-gradient(135deg, #dbeafe, #3b82f6);
}

.attachment-card-icon--image {
  background: linear-gradient(135deg, #dcfce7, #22c55e);
}

.attachment-card-icon--other {
  background: linear-gradient(135deg, #e5e7eb, #9ca3af);
}

.attachment-card-main {
  flex: 1;
  display: flex;
  flex-direction: column;
  justify-content: center;
}

.attachment-card-name {
  font-size: 26rpx;
  font-weight: 500;
  color: #111827;
  margin-bottom: 6rpx;
}

.attachment-card-meta {
  display: flex;
  align-items: center;
  font-size: 22rpx;
  color: #6b7280;
}

.attachment-card-size {
  margin-right: 4rpx;
}

.attachment-card-dot {
  margin: 0 4rpx;
}

.attachment-card-ext {
  font-weight: 500;
}

.attachment-card-action {
  margin-left: 16rpx;
}

.attachment-card-download {
  font-size: 28rpx;
}

.error {
  display: flex;
  align-items: center;
  justify-content: center;
}

.error-text {
  font-size: 26rpx;
  color: #9ca3af;
}
</style>

