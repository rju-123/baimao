<template>
  <view class="page">
    <!-- 审核通过：直接进入下单页面 -->
    <view v-if="status === 'approved'" class="status-card success">
      <view class="status-icon">✓</view>
      <view class="status-title">审核通过</view>
      <view class="status-desc">您已成为企业管理员，正在进入下单页面…</view>
      <button class="action-btn" @tap="goToOrder">进入下单</button>
    </view>

    <!-- 审核失败 -->
    <view v-else-if="status === 'rejected'" class="status-card error">
      <view class="status-icon">!</view>
      <view class="status-title">审核失败</view>
      <view class="status-desc">请联系工作人员了解详情</view>
      <view class="status-contact">联系电话：{{ displayContactPhone }}</view>
      <view class="action-btns">
        <button class="action-btn" @tap="modifyAndRefill">修改公司信息重新申请</button>
        <button class="action-btn ghost" @tap="abandonAndGoSales">放弃申请，以销售身份入驻</button>
      </view>
    </view>

    <!-- 提交成功，等待审核 -->
    <view v-else-if="status === 'pending'" class="status-card success">
      <view class="status-icon">✓</view>
      <view class="status-title">提交成功</view>
      <view class="status-desc">请等待后台审核</view>
      <view class="status-contact">联系电话：{{ displayContactPhone }}</view>
      <button class="action-btn" @tap="goToRoleSelection">我知道了</button>
    </view>

    <!-- 待提交：表单 -->
    <view v-else class="form-section">
      <view class="title">提交开票信息</view>
      <view class="desc">请上传清晰的开票信息照片或文件</view>

      <view class="form-card">
        <view class="form-item">
          <text class="label">你的姓名</text>
          <nut-input v-model="form.salesName" placeholder="请输入你的姓名" />
        </view>
        <view class="form-item">
          <text class="label">企业名称</text>
          <nut-input v-model="form.companyName" placeholder="请输入企业全称" />
        </view>
        <view class="form-item">
          <text class="label">联系人姓名</text>
          <nut-input v-model="form.contactName" placeholder="请输入联系人姓名" />
        </view>
        <view class="form-item">
          <text class="label">注册地址</text>
          <nut-input v-model="form.registeredAddress" placeholder="请输入企业注册地址" />
        </view>
        <view class="form-item">
          <text class="label">联系电话</text>
          <nut-input v-model="form.contactPhone" type="number" maxlength="11" placeholder="11位手机号" />
        </view>
        <view class="form-item">
          <text class="label">税号</text>
          <nut-input v-model="form.taxNo" placeholder="统一社会信用代码" />
        </view>
        <view class="form-item">
          <text class="label">开户银行</text>
          <nut-input v-model="form.bankName" placeholder="请输入开户银行名称" />
        </view>
        <view class="form-item">
          <text class="label">银行账号</text>
          <nut-input v-model="form.bankAccount" type="number" placeholder="请输入银行账号" />
        </view>

        <view class="upload-section">
          <text class="label">开票资料</text>
          <view class="upload-area" @tap="chooseImage">
            <view v-if="!invoiceImagePath" class="upload-placeholder">
              <text class="upload-icon">+</text>
              <text class="upload-text">点击上传开票资料</text>
              <text class="upload-hint">支持 JPG、PNG 格式</text>
            </view>
            <view v-else class="upload-preview">
              <image :src="previewImageUrl" mode="aspectFit" class="preview-img" />
              <text class="preview-name">{{ previewFileName }}</text>
            </view>
          </view>
        </view>
      </view>

      <button class="submit-btn" :disabled="submitting" @tap="submit">
        {{ submitting ? '提交中...' : '提交' }}
      </button>
    </view>
  </view>
</template>

<script setup lang="ts">
import { ref, computed, onMounted } from 'vue';
import { onShow } from '@dcloudio/uni-app';
import { CommonApi, PartnerApi } from '@/api';
import useUserStore from '@/store/modules/user';

const userStore = useUserStore();

const status = ref<'idle' | 'pending' | 'approved' | 'rejected'>('idle');
const approvedCompanyId = ref<number | null>(null);
const FIXED_CONTACT_PHONE = '138XXXXXXXX';
const displayContactPhone = ref(FIXED_CONTACT_PHONE);
const rejectedFormData = ref<Record<string, string> | null>(null);
const invoiceImagePath = ref('');
const previewFileName = ref('');
const submitting = ref(false);
// 驳回后点击“修改资料”进入编辑态；编辑态下 onShow 不应把页面强制切回 rejected
const editingAfterRejected = ref(false);

const form = ref({
  salesName: '',
  companyName: '',
  contactName: '',
  registeredAddress: '',
  contactPhone: '',
  taxNo: '',
  bankName: '',
  bankAccount: '',
});

const previewImageUrl = computed(() => {
  if (!invoiceImagePath.value)
    return '';
  if (invoiceImagePath.value.startsWith('http'))
    return invoiceImagePath.value;
  const base = import.meta.env.VITE_API_BASE_URL || '';
  return `${base.replace(/\/$/, '')}/${invoiceImagePath.value}`;
});

function chooseImage() {
  if (status.value === 'pending')
    return;
  uni.chooseImage({
    count: 1,
    sizeType: ['compressed'],
    sourceType: ['album', 'camera'],
    success: async (res) => {
      const path = res.tempFilePaths?.[0];
      if (!path)
        return;
      try {
        const result = await CommonApi.uploadFile(path) as { path?: string; url?: string };
        invoiceImagePath.value = result?.path || result?.url || path;
        previewFileName.value = path.split('/').pop() || '已上传';
      }
      catch (e) {
        uni.showToast({ title: '上传失败', icon: 'none' });
      }
    },
  });
}

function validate(): string | null {
  const f = form.value;
  if (!f.salesName.trim())
    return '请填写你的姓名';
  if (!f.companyName.trim())
    return '请填写企业名称';
  if (!f.contactName.trim())
    return '请填写联系人姓名';
  if (!f.registeredAddress.trim())
    return '请填写注册地址';
  if (!/^1\d{10}$/.test(f.contactPhone))
    return '请填写正确的11位手机号';
  if (!f.taxNo.trim())
    return '请填写税号';
  if (!f.bankName.trim())
    return '请填写开户银行';
  if (!f.bankAccount.trim())
    return '请填写银行账号';
  if (!invoiceImagePath.value)
    return '请上传开票资料图片';
  return null;
}

async function submit() {
  const err = validate();
  if (err) {
    uni.showToast({ title: err, icon: 'none' });
    return;
  }
  const userId = Number(userStore.user_id || 0);
  if (!userId) {
    uni.showToast({ title: '请先登录', icon: 'none' });
    return;
  }
  if (submitting.value)
    return;
  submitting.value = true;
  try {
    await PartnerApi.submitInvoice({
      userId,
      salesName: form.value.salesName.trim(),
      companyName: form.value.companyName.trim(),
      contactName: form.value.contactName.trim(),
      contactPhone: form.value.contactPhone.trim(),
      registeredAddress: form.value.registeredAddress.trim(),
      taxNo: form.value.taxNo.trim(),
      bankName: form.value.bankName.trim(),
      bankAccount: form.value.bankAccount.trim(),
      invoiceImagePath: invoiceImagePath.value,
    });
    status.value = 'pending';
    editingAfterRejected.value = false;
    displayContactPhone.value = FIXED_CONTACT_PHONE;
    uni.showToast({ title: '已提交，等待审核', icon: 'none' });
  }
  catch (e: any) {
    uni.showToast({ title: e?.message || '提交失败', icon: 'none' });
  }
  finally {
    submitting.value = false;
  }
}

async function loadStatus() {
  userStore.normalizeUserId();
  const userId = Number(userStore.user_id || 0);
  if (!userId)
    return;
  try {
    const res = await PartnerApi.getInvoiceStatus(userId);
    if (res?.status === 'approved') {
      status.value = 'approved';
      editingAfterRejected.value = false;
      approvedCompanyId.value = res.id ?? null;
    }
    else if (res?.status === 'rejected') {
      // 用户正在驳回后编辑资料时（例如选图返回触发 onShow），不要打断表单页
      if (editingAfterRejected.value && status.value === 'idle') {
        rejectedFormData.value = {
          companyName: res.companyName || '',
          contactName: res.contactName || '',
          registeredAddress: res.registeredAddress || '',
          contactPhone: res.contactPhone || '',
          taxNo: res.taxNo || '',
          bankName: res.bankName || '',
          bankAccount: res.bankAccount || '',
        };
        return;
      }
      status.value = 'rejected';
      rejectedFormData.value = {
        salesName: (res as any).salesName || '',
        companyName: res.companyName || '',
        contactName: res.contactName || '',
        registeredAddress: res.registeredAddress || '',
        contactPhone: res.contactPhone || '',
        taxNo: res.taxNo || '',
        bankName: res.bankName || '',
        bankAccount: res.bankAccount || '',
      };
      if (res.invoiceImagePath) {
        invoiceImagePath.value = res.invoiceImagePath;
        previewFileName.value = '已上传';
      }
    }
    else if (res?.status === 'pending') {
      status.value = 'pending';
      editingAfterRejected.value = false;
      displayContactPhone.value = FIXED_CONTACT_PHONE;
    }
  }
  catch {
    // ignore
  }
}

function resetAndRefill() {
  status.value = 'idle';
  editingAfterRejected.value = false;
  form.value = {
    salesName: '',
    companyName: '',
    contactName: '',
    registeredAddress: '',
    contactPhone: '',
    taxNo: '',
    bankName: '',
    bankAccount: '',
  };
  invoiceImagePath.value = '';
  previewFileName.value = '';
}

function modifyAndRefill() {
  const data = rejectedFormData.value;
  if (data) {
    form.value = {
      salesName: (data as any).salesName || '',
      companyName: data.companyName || '',
      contactName: data.contactName || '',
      registeredAddress: data.registeredAddress || '',
      contactPhone: data.contactPhone || '',
      taxNo: data.taxNo || '',
      bankName: data.bankName || '',
      bankAccount: data.bankAccount || '',
    };
  }
  editingAfterRejected.value = true;
  status.value = 'idle';
}

async function abandonAndGoSales() {
  const userId = Number(userStore.user_id || 0);
  if (!userId) {
    uni.showToast({ title: '请先登录', icon: 'none' });
    return;
  }
  try {
    await PartnerApi.abandonInvoice(userId);
    uni.redirectTo({ url: '/pages/sales/company-selection/index' });
  }
  catch (e: any) {
    uni.showToast({ title: e?.message || '操作失败', icon: 'none' });
  }
}

function goCompanySelection() {
  const cid = approvedCompanyId.value;
  const url = cid
    ? `/pages/sales/company-selection/index?companyId=${cid}`
    : '/pages/sales/company-selection/index';
  uni.redirectTo({ url });
}

function goToOrder() {
  uni.switchTab({ url: '/pages/sales/order/index' });
}

function goToRoleSelection() {
  uni.redirectTo({ url: '/pages/common/role-selection/index' });
}

onMounted(() => {
  loadStatus();
});

onShow(() => {
  loadStatus();
});
</script>

<style scoped lang="scss">
.page {
  min-height: 100vh;
  padding: 32rpx 32rpx 48rpx;
  box-sizing: border-box;
  background: linear-gradient(180deg, var(--theme-bg-gradient-start) 0%, var(--theme-bg-gradient-end) 100%);
}

.status-card {
  margin-top: 80rpx;
  padding: 64rpx 48rpx;
  border-radius: var(--theme-card-radius);
  background: #ffffff;
  text-align: center;
  box-shadow: var(--theme-card-shadow);

  &.success .status-icon {
    background: #34c759;
    color: #fff;
  }

  &.error .status-icon {
    background: #ff9500;
    color: #fff;
  }
}

.status-icon {
  width: 80rpx;
  height: 80rpx;
  line-height: 80rpx;
  border-radius: 50%;
  margin: 0 auto 24rpx;
  font-size: 48rpx;
  font-weight: 700;
}

.status-title {
  font-size: 36rpx;
  font-weight: 600;
  color: #111827;
  margin-bottom: 16rpx;
}

.status-desc {
  font-size: 28rpx;
  color: #6b7280;
  margin-bottom: 24rpx;
}

.status-contact {
  font-size: 26rpx;
  color: #6b7280;
  margin-bottom: 40rpx;
}

.action-btns {
  display: flex;
  flex-direction: column;
  gap: 20rpx;
}

.action-btn {
  height: 88rpx;
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 0 48rpx;
  border-radius: var(--theme-btn-radius);
  font-size: 30rpx;
  color: #fff;
  background: #007AFF;
  border: none;
  box-sizing: border-box;

  &::after {
    border: none;
  }

  &.ghost {
    background: transparent;
    color: #6b7280;
    border: 1rpx solid #e5e7eb;
  }
}

.form-section {
  .title {
    font-size: 36rpx;
    font-weight: 600;
    color: var(--theme-text-title);
    margin-bottom: 12rpx;
  }

  .desc {
    font-size: 26rpx;
    color: var(--theme-text-subtitle);
    margin-bottom: 32rpx;
  }
}

.form-card {
  padding: 32rpx;
  border-radius: var(--theme-card-radius);
  background: #ffffff;
  box-shadow: var(--theme-card-shadow);
  margin-bottom: 32rpx;
}

.form-item {
  margin-bottom: 28rpx;

  &:last-of-type {
    margin-bottom: 0;
  }
}

.label {
  display: block;
  font-size: 26rpx;
  color: #374151;
  margin-bottom: 12rpx;
}

/* 与添加公司页面对齐：使用 nut-input 的光标样式，保持文本框高度 96rpx */
.form-item :deep(.nut-input) {
  width: 100%;
  height: 96rpx;
  min-height: 96rpx;
  font-size: 28rpx;
  border: 1rpx solid #e5e7eb;
  border-radius: 12rpx;
  box-sizing: border-box;
}

.form-item :deep(.nut-input__inner) {
  height: 96rpx;
  min-height: 96rpx;
  padding: 0 24rpx;
  border-radius: 12rpx;
}

.form-item :deep(.nut-input__input) {
  font-size: 28rpx;
  line-height: 1.5;
}

.upload-section {
  margin-top: 32rpx;
}

.upload-area {
  margin-top: 12rpx;
  min-height: 200rpx;
  border: 2rpx dashed #d1d5db;
  border-radius: 16rpx;
  display: flex;
  align-items: center;
  justify-content: center;
  overflow: hidden;
}

.upload-placeholder {
  display: flex;
  flex-direction: column;
  align-items: center;
  padding: 40rpx;

  .upload-icon {
    font-size: 64rpx;
    color: #9ca3af;
    margin-bottom: 16rpx;
  }

  .upload-text {
    font-size: 28rpx;
    color: #6b7280;
    margin-bottom: 8rpx;
  }

  .upload-hint {
    font-size: 24rpx;
    color: #9ca3af;
  }
}

.upload-preview {
  width: 100%;
  padding: 24rpx;
  display: flex;
  flex-direction: column;
  align-items: center;

  .preview-img {
    width: 240rpx;
    height: 240rpx;
    border-radius: 12rpx;
  }

  .preview-name {
    margin-top: 12rpx;
    font-size: 24rpx;
    color: #6b7280;
  }
}

.submit-btn {
  width: 100%;
  padding: 28rpx;
  border-radius: var(--theme-btn-radius);
  font-size: 32rpx;
  color: #fff;
  background: #007AFF;
  border: none;

  &:disabled {
    opacity: 0.6;
  }

  &::after {
    border: none;
  }
}
</style>
