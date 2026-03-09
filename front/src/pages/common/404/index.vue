<template>
  <view class="not-found">
    <nut-navbar left-arrow @click-back="handleBack" />
    <nut-empty description="页面不存在" :image="emptyImg" />
  </view>
</template>

<script lang="ts" setup>
import { route } from '@/utils/uni-helpers';
import { HOME_PATH } from '@/router';

const emptyImg = '/static/images/404.png';

function handleBack() {
  route({ type: 'switchTab', url: HOME_PATH });
}
</script>

<style lang="scss" scoped>
.not-found {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  height: 100%;
  overflow: auto;
}
</style>
