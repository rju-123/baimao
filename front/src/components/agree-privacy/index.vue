<template>
  <nut-popup v-model:visible="visible" position="bottom" round round-radius="24" @close="closeAgreePrivacy">
    <view class="p-30rpx">
      <view class="text-lg text-black font-bold">
        <span>{{ initTitle }}</span>
      </view>

      <view class="flex flex-col">
        <span class="pt-30rpx text-black font-bold">{{ initSubTitle }}</span>
        <span class="pt-30rpx text-sm text-black">1.为向您提供基本的服务，我们会遵循正当、合法、必要的原则收集和使用必要的信息。</span>
        <span class="pt-30rpx text-sm text-black">2.基于您的授权我们可能会收集和使用您的相关信息，您有权拒绝或取消授权。</span>
        <span class="pt-30rpx text-sm text-black">3.未经您的授权同意，我们不会将您的信息共享给第三方或用于您未授权的其他用途。</span>
        <span class="pt-30rpx text-sm text-black">4.详细信息请您完整阅读<text class="text-decoration" @click="openPrivacyContract">{{ initPrivacyContractName }}</text></span>
      </view>

      <view class="mt-30rpx flex items-center justify-around pt-10rpx">
        <view class="min-w-100px">
          <button class="button button-default" @click="disagree">
            拒绝
          </button>
        </view>
        <view class="min-w-100px">
          <button
            :id="agreePrivacyId"
            class="button button-primary"
            open-type="agreePrivacyAuthorization"
            @agreeprivacyauthorization="agree"
          >
            同意
          </button>
        </view>
      </view>
    </view>
  </nut-popup>
</template>

<script setup lang="ts">
import { toast } from '@/utils/uni-helpers';

interface AgreePrivacyProps {
  modelValue: boolean;
  title: string;
  subTitle: string;
  disableCheckPrivacy: boolean;
  agreePrivacyId: string;
}

const props = withDefaults(defineProps<AgreePrivacyProps>(), {
  modelValue: false,
  title: '',
  subTitle: '',
  disableCheckPrivacy: true,
  agreePrivacyId: 'agree-btn',
});

const emit = defineEmits(['update:modelValue', 'needPrivacyAuthorization', 'agree', 'disagree']);

const visible = computed({
  get: () => props.modelValue,
  set: (v: boolean) => emit('update:modelValue', v),
});

const initTitle = ref<string>('隐私政策概要');
const initSubTitle = ref<string>('');
const initPrivacyContractName = ref<string>('隐私政策');

function openAgreePrivacy() {
  emit('update:modelValue', true);
}

function closeAgreePrivacy() {
  emit('update:modelValue', false);
}

function initData() {
  initTitle.value = props.title || initTitle.value;
  initSubTitle.value = props.subTitle || `亲爱的用户，感谢您一直以来的支持!为了更好地保护您的权益，同时遵守相关监管要求，请认真阅读${initPrivacyContractName.value}，特向您说明如下:`;
}

function checkPrivacySetting() {
  wx.getPrivacySetting({
    success: (res: any) => {
      if (res.needAuthorization) {
        initPrivacyContractName.value = res.privacyContractName;
        initData();
        if (!props.disableCheckPrivacy) {
          openAgreePrivacy();
        }
      }
    },
    fail: (_e: any) => {},
  });
}

function openPrivacyContract() {
  wx.openPrivacyContract({
    success: () => {},
    fail: (e: any) => {
      toast(`打开失败:${e}`);
    },
  });
}

function agree(e: any) {
  const buttonId = e?.target?.id || 'agree-btn';
  emit('agree', buttonId);
  emit('update:modelValue', false);
}

function disagree() {
  emit('disagree');
  closeAgreePrivacy();
}

onMounted(() => {
  checkPrivacySetting();
});
</script>

<style scoped lang="scss">
.button {
  position: relative;
  box-sizing: border-box;
  display: flex;
  flex-direction: row;
  align-items: center;
  justify-content: center;
  padding: 10px 20px;
  font-size: 14px;
  font-weight: 500;
  line-height: 1.5;
  text-align: center;
  text-decoration: none;
  border-radius: 24rpx;
}

.button-default {
  color: #007AFF;
  background-color: #ffffff;
  border: 1px solid #E0E0E0;
}

.button-primary {
  color: #fff;
  background-color: #007AFF;
}

button {
  padding: 0;
  margin: 0;
  line-height: inherit;
  outline: none;
  background-color: transparent;
  border-radius: 0;
}

button::after {
  border: none;
}

.text-decoration {
  color: #007AFF;
  text-decoration: underline;
}
</style>
