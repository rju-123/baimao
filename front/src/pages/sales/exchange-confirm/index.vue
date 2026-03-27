<template>
  <view class="page">
    <view v-if="!item && !loading" class="empty">
      商品不存在或已下架
    </view>

    <view v-else>
      <!-- 商品信息卡片 -->
      <view class="card">
        <view class="card-title">
          {{ item?.name || '' }}
        </view>
        <view class="card-subtitle">
          {{ itemTypeLabel }}
        </view>
        <view class="card-points">
          {{ item?.pointsRequired || 0 }} 积分/件
        </view>
        <view class="card-meta">
          库存 {{ item?.stock || 0 }} 件
        </view>
      </view>

      <!-- 收货地址（实体商品） -->
      <view
        v-if="item?.type === 'physical'"
        class="card address-card"
        @click="goSelectAddress"
      >
        <view class="section-header">
          收货地址
        </view>
        <view v-if="selectedAddress" class="addr-content">
          <view class="addr-row">
            <text class="addr-name">
              {{ selectedAddress.receiverName }}
            </text>
            <text class="addr-phone">
              {{ selectedAddress.receiverPhone }}
            </text>
          </view>
          <view class="addr-detail">
            {{ selectedAddress.region }} {{ selectedAddress.detail }}
          </view>
        </view>
        <view v-else class="addr-placeholder">
          请选择收货地址
        </view>
      </view>

      <!-- 积分信息 -->
      <view class="card">
        <view class="section-header">
          积分信息
        </view>
        <view class="points-row">
          <text class="label">
            当前积分
          </text>
          <text class="value">
            {{ currentPoints }}
          </text>
        </view>
        <view class="points-row">
          <text class="label">
            本次消耗
          </text>
          <text class="value negative">
            -{{ totalPoints }}
          </text>
        </view>
        <view class="points-row">
          <text class="label">
            兑换后剩余
          </text>
          <text
            class="value"
            :class="{ warning: remainPoints < 0 }"
          >
            {{ remainPoints }}
          </text>
        </view>
      </view>

      <!-- 底部按钮 -->
      <view class="footer">
        <nut-button
          block
          type="primary"
          :disabled="confirmDisabled"
          @click="handleConfirm"
        >
          确认兑换
        </nut-button>
      </view>
    </view>

  </view>

  <!-- 虚拟商品兑换成功弹窗 -->
  <view v-if="showCodeDialog" class="dialog-mask">
    <view class="dialog">
      <view class="dialog-icon">
        ✓
      </view>
      <view class="dialog-title">
        兑换成功
      </view>
      <view class="dialog-subtitle">
        {{ codeProductName }} 的兑换码如下
      </view>

      <view class="dialog-code-row" @click="handleCopyCode">
        <text class="dialog-code-text">
          {{ successCode }}
        </text>
        <view class="dialog-code-copy">
          复制
        </view>
      </view>

      <view class="dialog-tip">
        请妥善保存券码，尽快在对应平台完成兑换或激活。您也可以在“兑换记录”中查看此券码。
      </view>

      <button class="dialog-button" @click="handleCodeDialogConfirm">
        我知道了
      </button>
    </view>
  </view>
</template>

<script setup lang="ts">
import { computed, ref } from 'vue';
import { onLoad, onShow } from '@dcloudio/uni-app';
import { PointsApi, UserApi } from '@/api';
import type { PointsMallItem, ExchangeRecord } from '@/api/points';
import type { AddressItem } from '@/api/addresses';
import useUserStore from '@/store/modules/user';

const userStore = useUserStore();

const loading = ref(false);
const item = ref<PointsMallItem | null>(null);
const selectedAddress = ref<AddressItem | null>(null);

// 虚拟商品兑换成功弹窗状态
const showCodeDialog = ref(false);
const successCode = ref('');
const codeProductName = ref('');

// 使用本页独立的积分 ref，避免依赖外部 store 的异步更新时序
const currentPoints = ref<number>(userStore.points ?? 0);

const totalPoints = computed(() => {
  if (!item.value)
    return 0;
  // 一次只兑换一件
  return item.value.pointsRequired;
});

const remainPoints = computed(() => currentPoints.value - totalPoints.value);

const confirmDisabled = computed(() => {
  if (!item.value)
    return true;
  if (remainPoints.value < 0)
    return true;
  return false;
});

const itemTypeLabel = computed(() => {
  if (!item.value)
    return '';
  return item.value.type === 'physical' ? '实体商品' : '虚拟商品';
});

const loadItem = async (id: number) => {
  loading.value = true;
  try {
    const data = await PointsApi.getMallItem(id);
    item.value = data || null;
  }
  catch (err) {
    console.error('load mall item error', err);
    item.value = null;
    uni.showToast({ title: '加载积分商品失败', icon: 'none' });
  }
  finally {
    loading.value = false;
  }
};

// 从后端拉取最新积分，同步到本页与全局
const loadUserPoints = async () => {
  const id = Number(userStore.user_id || 0);
  if (!id)
    return;
  try {
    const user = await UserApi.getUser(id);
    const pts = user.points ?? 0;
    currentPoints.value = pts;
    userStore.setInfo({ points: pts });
  }
  catch (e) {
    console.warn('load points failed', e);
  }
};

const goSelectAddress = () => {
  if (!item.value || item.value.type !== 'physical')
    return;
  const currentId = selectedAddress.value ? selectedAddress.value.id : '';
  uni.navigateTo({
    url: `/pages/sales/address-select/index?selectedId=${currentId}`,
    // 监听子页面选择的地址
    events: {
      addressSelected(addr: AddressItem) {
        selectedAddress.value = addr;
      },
    },
  });
};

const handleConfirm = async () => {
  if (!item.value)
    return;
  // 实体商品必须选择收货地址
  if (item.value.type === 'physical' && !selectedAddress.value) {
    uni.showToast({ title: '请选择收货地址', icon: 'none' });
    return;
  }
  const userId = Number(userStore.user_id || 0);
  if (!userId) {
    uni.showToast({ title: '请先登录', icon: 'none' });
    return;
  }
  try {
    const payload = {
      userId,
      itemId: item.value.id,
      quantity: 1,
      addressSnapshot: item.value.type === 'physical' && selectedAddress.value
        ? `${selectedAddress.value.receiverName} ${selectedAddress.value.receiverPhone} ${selectedAddress.value.region} ${selectedAddress.value.detail}`
        : undefined,
    };
    const record: ExchangeRecord = await PointsApi.exchangeItem(payload);

    // 同步前端积分
    const newPoints = currentPoints.value - totalPoints.value;
    userStore.setInfo({ points: newPoints >= 0 ? newPoints : 0 });

    if (item.value.type === 'virtual') {
      // 打开自定义券码弹窗
      codeProductName.value = item.value.name;
      successCode.value = record.code || '暂无券码，请联系工作人员处理';
      showCodeDialog.value = true;
    } else {
      // 实体商品：仍然提示等待发货
      uni.showToast({ title: '兑换成功，等待发货', icon: 'success' });
      setTimeout(() => {
        uni.switchTab({
          url: '/pages/sales/points-mall/index',
        });
      }, 400);
    }
  }
  catch (err: any) {
    console.error('exchange error', err);
    const msg = (err && err.message) || '兑换失败，请稍后重试';
    uni.showToast({ title: msg, icon: 'none' });
  }
};

// 复制券码
const handleCopyCode = () => {
  if (!successCode.value)
    return;
  uni.setClipboardData({
    data: successCode.value,
    success: () => {
      uni.showToast({ title: '已复制到剪贴板', icon: 'none' });
    },
  });
};

// 弹窗“我知道了”按钮
const handleCodeDialogConfirm = () => {
  showCodeDialog.value = false;
  uni.switchTab({
    url: '/pages/sales/points-mall/index',
  });
};

// 页面显示时刷新积分，并尝试读取上一次地址选择结果
onShow(() => {
  loadUserPoints();
  try {
    const stored = uni.getStorageSync('sales_selected_address');
    if (stored) {
      // 可能是对象或 JSON 字符串，两种都兼容
      if (typeof stored === 'string') {
        selectedAddress.value = JSON.parse(stored) as AddressItem;
      }
      else {
        selectedAddress.value = stored as AddressItem;
      }
      uni.removeStorageSync('sales_selected_address');
    }
  }
  catch (e) {
    console.warn('load selected address failed', e);
  }
});

onLoad((options: Record<string, any>) => {
  const id = Number(options.itemId || options.id || 0);
  if (!id) {
    uni.showToast({ title: '缺少商品信息', icon: 'none' });
    return;
  }
  loadItem(id);
  // 首次加载时也立即拉取一次最新积分，避免当前积分为 0 导致按钮一直禁用
  loadUserPoints();
});
</script>

<style scoped lang="scss">
.page {
  min-height: 100vh;
  padding: 32rpx;
  box-sizing: border-box;
  background: linear-gradient(180deg, var(--theme-bg-gradient-start) 0%, var(--theme-bg-gradient-end) 100%);
}

.card {
  background-color: #ffffff;
  border-radius: var(--theme-card-radius);
  padding: 28rpx 32rpx;
  margin-bottom: 20rpx;
  box-shadow: var(--theme-card-shadow);
}

.card-title {
  font-size: 30rpx;
  font-weight: 600;
  color: #000000;
}

.card-subtitle {
  margin-top: 8rpx;
  font-size: 24rpx;
  color: #8e8e93;
}

.card-points {
  margin-top: 12rpx;
  font-size: 26rpx;
  color: #ff9500;
}

.card-meta {
  margin-top: 8rpx;
  font-size: 22rpx;
  color: #8e8e93;
}

.address-card {
  padding-right: 40rpx;
  min-height: 150rpx; /* 比普通卡片额外增加约 50px 高度 */
}

.addr-content {
  margin-top: 12rpx;
}

.addr-row {
  display: flex;
  align-items: center;
  margin-bottom: 4rpx;
}

.addr-name {
  font-size: 28rpx;
  font-weight: 600;
  margin-right: 16rpx;
}

.addr-phone {
  font-size: 26rpx;
  color: #333333;
}

.addr-detail {
  font-size: 24rpx;
  color: #8e8e93;
}

.addr-placeholder {
  margin-top: 12rpx;
  font-size: 24rpx;
  color: #b0b0b0;
}

.section-header {
  font-size: 26rpx;
  font-weight: 500;
  margin-bottom: 16rpx;
}

.qty-row {
  display: flex;
  align-items: center;
  justify-content: space-between;
}

.qty-controls {
  display: flex;
  align-items: center;
}

.qty-btn {
  width: 60rpx;
  height: 60rpx;
  border-radius: 8rpx;
  border: none;
  background-color: #f5f5f5;
  font-size: 32rpx;
}

.qty-input {
  width: 100rpx;
  margin: 0 12rpx;
  text-align: center;
  border-radius: 8rpx;
  border: 1rpx solid #e5e5e5;
  font-size: 26rpx;
  padding: 8rpx 0;
}

.stock-hint {
  margin-left: 16rpx;
  font-size: 22rpx;
  color: #8e8e93;
}

.address-input {
  width: 100%;
  min-height: 120rpx;
  padding: 16rpx;
  box-sizing: border-box;
  border-radius: 24rpx;
  background-color: #f5f6fa;
  font-size: 24rpx;
}

.points-row {
  display: flex;
  justify-content: space-between;
  font-size: 24rpx;
  margin-bottom: 8rpx;
}

.points-row .label {
  color: #8e8e93;
}

.points-row .value {
  color: #000000;
}

.points-row .value.negative {
  color: #ff3b30;
}

.points-row .value.warning {
  color: #ff3b30;
}

.footer {
  margin-top: 24rpx;
}

.empty {
  padding: 80rpx 0;
  text-align: center;
  color: #8e8e93;
  font-size: 26rpx;
}

/* 虚拟商品兑换成功弹窗样式 */
.dialog-mask {
  position: fixed;
  left: 0;
  right: 0;
  top: 0;
  bottom: 0;
  background-color: rgba(0, 0, 0, 0.45);
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 999;
}

.dialog {
  width: 600rpx;
  padding: 40rpx 32rpx 32rpx;
  border-radius: var(--theme-card-radius);
  background-color: #ffffff;
  text-align: center;
  box-shadow: var(--theme-card-shadow);
}

.dialog-icon {
  width: 80rpx;
  height: 80rpx;
  border-radius: 40rpx;
  margin: 0 auto 16rpx;
  background-color: #e5f8ea;
  color: #34c759;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 40rpx;
  font-weight: 600;
}

.dialog-title {
  font-size: 32rpx;
  font-weight: 600;
  margin-bottom: 8rpx;
}

.dialog-subtitle {
  font-size: 26rpx;
  color: #555555;
  margin-bottom: 24rpx;
}

.dialog-code-row {
  margin: 0 auto 16rpx;
  padding: 16rpx 20rpx;
  border-radius: 16rpx;
  background-color: #f5f5f7;
  display: flex;
  align-items: center;
  justify-content: space-between;
}

.dialog-code-text {
  font-size: 30rpx;
  font-weight: 600;
  letter-spacing: 4rpx;
}

.dialog-code-copy {
  padding: 8rpx 20rpx;
  border-radius: var(--theme-btn-radius);
  background-color: #007AFF;
  color: #ffffff;
  font-size: 24rpx;
}

.dialog-tip {
  font-size: 22rpx;
  color: #8e8e93;
  text-align: left;
  margin: 0 4rpx 24rpx;
}

.dialog-button {
  width: 100%;
  height: 88rpx;
  line-height: 88rpx;
  text-align: center;
  border-radius: 44rpx;
  background-color: #0a7aff;
  color: #ffffff;
  font-size: 30rpx;
}

</style>

