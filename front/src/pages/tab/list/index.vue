<template>
  <z-paging ref="pagingRef" v-model="dataList" @query="queryList">
    <view v-for="(item, index) in dataList" :key="index">
      <nut-cell :title="`列表长度-${index + 1}`">
        <template #icon>
          <nut-avatar size="normal" :src="item" shape="square" />
        </template>
      </nut-cell>
    </view>
  </z-paging>
</template>

<script setup lang="ts">
import { random } from '@/utils/uni-helpers';

const pagingRef = ref<ZPagingRef<string> | null>(null);
const dataList = ref<string[]>([]);

const urls: string[] = [
  'https://picsum.photos/100/100?random=1',
  'https://picsum.photos/100/100?random=2',
  'https://picsum.photos/100/100?random=3',
  'https://picsum.photos/100/100?random=4',
  'https://picsum.photos/100/100?random=5',
  'https://picsum.photos/100/100?random=6',
  'https://picsum.photos/100/100?random=7',
  'https://picsum.photos/100/100?random=8',
  'https://picsum.photos/100/100?random=9',
  'https://picsum.photos/100/100?random=10',
];

function queryList(pageNo: number, pageSize: number) {
  setTimeout(() => {
    const list: string[] = [];
    for (let i = 0; i < 30; i++)
      list.push(urls[random(0, urls.length - 1)]);
    pagingRef.value?.complete(list);
  }, 1000);
}
</script>
