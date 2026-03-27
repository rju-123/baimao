<script setup lang="ts">
import { onHide, onLaunch, onShow } from '@dcloudio/uni-app';
import { useAppStore } from '@/store';
import { mpUpdate } from '@/utils/index';

const appStore = useAppStore();

onLaunch(() => {
  console.log('App Launch');

  // 初始化系统信息
  appStore.initSystemInfo();

  // #ifdef MP-WEIXIN
  mpUpdate();
  // #endif
});

onShow(() => {
  console.log('App Show');
});

onHide(() => {
  console.log('App Hide');
});
</script>

<style lang="scss">
/* 每个页面公共 css，NutUI 通过 easycom 按需引入 */
@import '@/static/styles/common.scss';
@import '@/static/styles/nut-override.scss';
</style>
