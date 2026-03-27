<template>
  <view class="page">
    <view class="form-card">
      <view class="form-item">
        <text class="label">收货人</text>
        <input
          v-model="form.receiverName"
          class="input"
          placeholder="请填写收货人姓名"
        >
      </view>
      <view class="form-item">
        <text class="label">联系方式</text>
        <input
          v-model="form.receiverPhone"
          class="input"
          type="number"
          maxlength="11"
          placeholder="请填写收货人手机号"
        >
      </view>
      <!-- 所在地区：使用原生 region picker 包裹整行 -->
      <picker mode="region" @change="onRegionChange">
        <view class="form-item clickable">
          <text class="label">所在地区</text>
          <view class="value">
            <text v-if="form.region">
              {{ form.region }}
            </text>
            <text v-else class="placeholder">
              省市区县、乡镇等
            </text>
          </view>
        </view>
      </picker>
      <view class="form-item">
        <text class="label">详细地址</text>
        <textarea
          v-model="form.detail"
          class="textarea"
          placeholder="街道、楼牌号等"
          auto-height
        />
      </view>
    </view>

    <view class="form-card">
      <view class="form-item inline">
        <text class="label">
          设为默认地址
        </text>
        <switch
          :checked="form.isDefault"
          @change="onDefaultChange"
        />
      </view>
    </view>

    <view class="footer">
      <button class="save-btn" @click="handleSave">
        保存
      </button>
    </view>
  </view>
</template>

<script setup lang="ts">
import { reactive, ref } from 'vue';
import { onLoad } from '@dcloudio/uni-app';
import { AddressesApi } from '@/api';
import type { AddressItem } from '@/api/addresses';
import useUserStore from '@/store/modules/user';

const userStore = useUserStore();

const editingId = ref<number | null>(null);

const form = reactive({
  receiverName: '',
  receiverPhone: '',
  region: '',
  detail: '',
  isDefault: false,
});

const onRegionChange = (e: any) => {
  const value = e.detail?.value || [];
  form.region = Array.isArray(value) ? value.join(' ') : '';
};

const validate = () => {
  if (!form.receiverName.trim()) {
    uni.showToast({ title: '请填写收货人姓名', icon: 'none' });
    return false;
  }
  if (!form.receiverPhone.trim() || form.receiverPhone.trim().length !== 11) {
    uni.showToast({ title: '请填写正确的手机号', icon: 'none' });
    return false;
  }
  if (!form.region.trim()) {
    uni.showToast({ title: '请选择所在地区', icon: 'none' });
    return false;
  }
  if (!form.detail.trim()) {
    uni.showToast({ title: '请填写详细地址', icon: 'none' });
    return false;
  }
  return true;
};

const onDefaultChange = (e: any) => {
  form.isDefault = !!e.detail?.value;
};

const handleSave = async () => {
  if (!validate())
    return;
  const userId = Number(userStore.user_id || 0);
  if (!userId) {
    uni.showToast({ title: '请先登录', icon: 'none' });
    return;
  }
  try {
    if (editingId.value) {
      await AddressesApi.updateAddress(editingId.value, {
        receiverName: form.receiverName.trim(),
        receiverPhone: form.receiverPhone.trim(),
        region: form.region.trim(),
        detail: form.detail.trim(),
        isDefault: form.isDefault,
      });
    }
    else {
      await AddressesApi.createAddress(userId, {
        receiverName: form.receiverName.trim(),
        receiverPhone: form.receiverPhone.trim(),
        region: form.region.trim(),
        detail: form.detail.trim(),
        isDefault: form.isDefault,
      });
    }
    uni.showToast({ title: '保存成功', icon: 'success' });
    setTimeout(() => {
      uni.navigateBack();
    }, 400);
  }
  catch (e) {
    console.error('save address error', e);
    uni.showToast({ title: '保存失败，请稍后再试', icon: 'none' });
  }
};

const fillForm = (addr: AddressItem) => {
  form.receiverName = addr.receiverName;
  form.receiverPhone = addr.receiverPhone;
  form.region = addr.region;
  form.detail = addr.detail;
  form.isDefault = !!addr.isDefault;
};

onLoad((options: Record<string, any>) => {
  const id = Number(options.id || 0);
  if (id) {
    editingId.value = id;
    // 优先从 storage 读取（地址管理页传入）
    try {
      const cached = uni.getStorageSync('sales_edit_address') as AddressItem | null;
      if (cached && cached.id === id) {
        fillForm(cached);
        uni.removeStorageSync('sales_edit_address');
        return;
      }
    }
    catch (e) {
      console.warn('getStorage edit address failed', e);
    }
    // 兼容微信 eventChannel
    // #ifdef MP-WEIXIN
    // eslint-disable-next-line @typescript-eslint/ban-ts-comment
    // @ts-ignore
    const channel = getOpenerEventChannel ? getOpenerEventChannel() : null;
    if (channel) {
      channel.on('editAddress', (addr: AddressItem) => {
        fillForm(addr);
      });
    }
    // #endif
  }
});
</script>

<style scoped lang="scss">
.page {
  min-height: 100vh;
  padding: 32rpx;
  box-sizing: border-box;
  background: linear-gradient(180deg, var(--theme-bg-gradient-start) 0%, var(--theme-bg-gradient-end) 100%);
}

.form-card {
  background-color: #ffffff;
  border-radius: var(--theme-card-radius);
  padding: 16rpx 32rpx;
  margin-bottom: 24rpx;
  box-shadow: var(--theme-card-shadow);
}

.form-item {
  display: flex;
  align-items: center;
  padding: 24rpx 0;
  border-bottom: 1rpx solid #f3f4f6;
}

.form-item:last-child {
  border-bottom: none;
}

.form-item.inline {
  justify-content: space-between;
}

.label {
  width: 180rpx;
  font-size: 26rpx;
  color: var(--theme-text-title);
}

.input {
  flex: 1;
  font-size: 26rpx;
}

.textarea {
  flex: 1;
  min-height: 120rpx;
  font-size: 26rpx;
}

.clickable {
  justify-content: space-between;
}

.value {
  flex: 1;
  text-align: right;
  font-size: 26rpx;
  color: var(--theme-text-title);
}

.placeholder {
  color: var(--theme-text-subtitle);
}

.footer {
  position: fixed;
  left: 0;
  right: 0;
  bottom: 0;
  padding: 20rpx 32rpx env(safe-area-inset-bottom);
  box-sizing: border-box;
  background-color: rgba(255, 255, 255, 0.98);
  box-shadow: 0 -10rpx 30rpx rgba(0, 122, 255, 0.06);
}

.save-btn {
  width: 100%;
  height: 88rpx;
  line-height: 88rpx;
  text-align: center;
  border-radius: var(--theme-btn-radius);
  background-color: #007AFF;
  color: #ffffff;
  font-size: 30rpx;
}
</style>

