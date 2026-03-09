<template>
  <view class="page-wrap">
    <nut-navbar title="" :left-show="false" right="camera-fill" />
    <view class="flex items-center pb-30rpx pl-30rpx pr-20rpx">
      <view class="mr-10rpx">
        <nut-avatar size="large" :src="avatarUrl" />
      </view>
      <view class="flex-1">
        <view class="pb-20rpx text-36rpx">
          uni-app
        </view>
        <view class="u-tips-color text-28rpx" @click="toCopy">
          微信号:uni-app
        </view>
      </view>
      <view class="ml-10rpx p-10rpx">
        <nut-icon name="scan" color="#969799" />
      </view>
      <view class="ml-10rpx p-10rpx">
        <nut-icon name="right" color="#969799" />
      </view>
    </view>

    <view class="mt-20rpx">
      <nut-cellgroup>
        <nut-cell title="支付" is-link>
          <template #icon>
            <nut-icon name="currency" />
          </template>
        </nut-cell>
      </nut-cellgroup>
    </view>

    <view class="mt-20rpx">
      <nut-cellgroup>
        <nut-cell title="收藏" is-link><template #icon><nut-icon name="star" /></template></nut-cell>
        <nut-cell title="相册" is-link><template #icon><nut-icon name="photo" /></template></nut-cell>
        <nut-cell title="卡券" is-link><template #icon><nut-icon name="coupon" /></template></nut-cell>
        <nut-cell title="关注" is-link><template #icon><nut-icon name="heart" /></template></nut-cell>
      </nut-cellgroup>
    </view>

    <view class="mt-20rpx">
      <nut-cellgroup>
        <nut-cell title="设置" is-link>
          <template #icon>
            <nut-icon name="setting" />
          </template>
        </nut-cell>
      </nut-cellgroup>
    </view>
  </view>
</template>

<script setup lang="ts">
import { useClipboard, usePermission } from '@/hooks';

const avatarUrl = '/static/images/logo.png';
const { setClipboardData, getClipboardData } = useClipboard();

const toCopy = async () => {
  await setClipboardData({ data: '1234567890' });
  const data = await getClipboardData();
  console.log('[ data ] >', data);
};

onShow(async () => {
  const hasPermission = await usePermission();
  console.log(hasPermission ? '已登录' : '未登录，拦截跳转');
});
</script>
