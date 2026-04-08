<template>
  <view class="page" v-if="order">
    <!-- 顶部：标题（产品名称+数量）、状态、订单号/创建时间/交付时间 -->
    <view class="card card-header">
      <view class="header-top">
        <view class="header-title">
          {{ headerTitle }}
        </view>
        <view class="header-status" :class="`status-${order.status}`">
          {{ statusText }}
        </view>
      </view>
      <view class="header-meta">
        <view class="meta-row">
          <text class="meta-label">订单号</text>
          <text class="meta-value">{{ order.orderNo }}</text>
        </view>
        <view class="meta-row">
          <text class="meta-label">创建时间</text>
          <text class="meta-value">{{ formatOrderTime(order) }}</text>
        </view>
        <view class="meta-row">
          <text class="meta-label">交付时间</text>
          <text class="meta-value">{{ deliveryTimeDisplay }}</text>
        </view>
      </view>
    </view>

    <!-- 订单内容：每个产品 名称、订单详情、单价×数量、小计 -->
    <view class="card card-content">
      <view class="section-title">
        订单内容
      </view>
      <view
        v-for="(item, idx) in orderItems"
        :key="idx"
        class="content-item"
      >
        <view class="item-name">
          {{ item.name }}
        </view>
        <view class="item-detail-label">
          订单详情
        </view>
        <view class="item-detail-text">
          {{ item.detail || '—' }}
        </view>
        <view class="item-price-row">
          <text class="item-price-qty">
            {{ item.unitPrice != null ? `¥${formatAmount(item.unitPrice)} × ${item.quantity}` : `× ${item.quantity}` }}
          </text>
          <text v-if="item.subtotal != null" class="item-subtotal">
            ¥{{ formatAmount(item.subtotal) }}
          </text>
        </view>
        <view v-if="idx < orderItems.length - 1" class="item-divider" />
      </view>
      <view class="content-total">
        <text class="total-label">订单总额</text>
        <text class="total-value">¥{{ formatAmount(order.payAmount) }}</text>
      </view>
    </view>

    <!-- 客户信息（来自后台产品信息） -->
    <view class="card" v-if="customerInfoDisplay">
      <view class="section-title">
        客户信息
      </view>
      <view class="info-row">
        <text class="info-value">{{ customerInfoDisplay }}</text>
      </view>
    </view>

    <!-- 接单人 -->
    <view class="card">
      <view class="section-title">
        接单人
      </view>
      <view class="info-row">
        <text class="info-label">姓名</text>
        <text class="info-value">{{ order.whitehatName || '暂未指派' }}</text>
      </view>
      <view class="info-row">
        <text class="info-label">联系电话</text>
        <text class="info-value">{{ maskPhone(order.whitehatPhone) }}</text>
      </view>
    </view>

    <!-- 电子合同 -->
    <view class="card">
      <view class="section-title">
        电子合同
      </view>
      <view v-if="contractFileUrl" class="contract-actions">
        <button class="contract-btn primary contract-btn-download" @tap="downloadContract">
          下载
        </button>
      </view>
      <view v-else class="contract-empty">
        <text v-if="contractEnsurePending" class="contract-empty-text">正在生成电子合同…</text>
        <text v-else class="contract-empty-text">暂无电子合同（生成失败或未就绪时可稍后重试）</text>
      </view>
    </view>
  </view>
  <view v-else class="page loading">
    <view class="theme-text-tips">正在加载订单详情...</view>
  </view>
</template>

<script setup lang="ts">
import { onLoad, onShow } from '@dcloudio/uni-app';
import { OrderApi, ProductApi } from '@/api';
import { toast } from '@/utils/uni-helpers';

const order = ref<OrderApi.Order | null>(null);
const product = ref<ProductApi.Product | null>(null);
/** 当前详情订单 ID，用于 onShow 再次拉单（合同异步生成完成后可刷出） */
const currentOrderId = ref(0);
/** 正在请求后端生成合同时展示，避免误以为无合同 */
const contractEnsurePending = ref(false);

/** 并发生成合同时合并为单次请求（onShow 可能连续触发） */
let contractEnsureInFlight: Promise<void> | null = null;

/** 兼容 API 返回 camelCase / snake_case */
function normalizeOrder(raw: OrderApi.Order | Record<string, unknown>): OrderApi.Order {
  const r = raw as Record<string, unknown>;
  return {
    ...(raw as OrderApi.Order),
    contractUrl: (r.contractUrl ?? r.contract_url) as string | undefined,
    contractStatus: (r.contractStatus ?? r.contract_status) as string | undefined,
    productCustomer: (r.productCustomer ?? r.product_customer) as string | undefined,
    lineItemsJson: (r.lineItemsJson ?? r.line_items_json) as any[] | null | undefined,
  };
}

/** 电子合同文件地址（归一化后） */
const contractFileUrl = computed(() => {
  const o = order.value;
  if (!o) return '';
  const u = (o as Record<string, unknown>).contractUrl ?? (o as Record<string, unknown>).contract_url;
  const s = u != null ? String(u).trim() : '';
  return s;
});

/** 标题：产品名称及对应数量（单商品为 "名称 × 数量"，多商品为汇总文案） */
const headerTitle = computed(() => {
  if (!order.value) return '';
  const o = order.value;
  // 合并单：productName 已是 "产品Ax2，产品Bx1"
  if (isMergedOrder(o))
    return o.productName;
  return `${o.productName} × ${o.quantity}`;
});

/** 是否合并单（购物车多商品下单） */
function isMergedOrder(o: OrderApi.Order): boolean {
  const name = (o.productName || '').trim();
  return name.includes('，') || /^.+\d+$/.test(name);
}

/** 解析订单为展示项：单商品一条；合并单按 "名称x数量" 拆分 */
interface OrderItemRow {
  name: string;
  quantity: number;
  unitPrice?: number;
  subtotal?: number;
  detail?: string;
}

const orderItems = computed<OrderItemRow[]>(() => {
  if (!order.value) return [];
  const o = order.value;
  const detail = (o.productDetail || product.value?.detail || '').trim() || undefined;

  if (!isMergedOrder(o)) {
    const qty = Math.max(1, Number(o.quantity || 1));
    const unit = Number(o.unitPrice ?? 0);
    const sub = Number(o.amount ?? 0) || unit * qty;
    return [{
      name: o.productName,
      quantity: qty,
      unitPrice: unit,
      subtotal: sub,
      detail,
    }];
  }

  const parts = o.productName.split('，').map(s => s.trim()).filter(Boolean);
  const rows: OrderItemRow[] = [];
  for (const part of parts) {
    const match = part.match(/^(.+?)x(\d+)$/);
    if (match) {
      rows.push({
        name: match[1].trim(),
        quantity: parseInt(match[2], 10) || 1,
        detail,
      });
    } else {
      rows.push({ name: part, quantity: 1, detail });
    }
  }
  if (rows.length === 0)
    rows.push({ name: o.productName, quantity: 1, detail });
  return rows;
});

/** 交付时间：单商品用产品交付时间，合并单暂无 */
const deliveryTimeDisplay = computed(() => {
  if (product.value?.deliveryTime)
    return String(product.value.deliveryTime);
  return '—';
});

/** 客户信息：来自后台产品信息的 product_customer 字段，与订单列表展示一致 */
const customerInfoDisplay = computed(() => {
  const o = order.value;
  if (!o) return '';
  const raw = (o as any).lineItemsJson ?? (o as any).line_items_json;
  if (Array.isArray(raw) && raw.length) {
    const set = new Set<string>();
    for (const it of raw) {
      const c = String(it?.customer ?? '').trim();
      if (c)
        set.add(c);
    }
    if (set.size)
      return Array.from(set).join('、');
  }
  const s = (o.productCustomer ?? (o as any).product_customer ?? '').trim();
  return s;
});

const statusText = computed(() => {
  if (!order.value) return '';
  const map: Record<string, string> = {
    signing: '签署中',
    pending_contract: '待签约',
    pending_fulfillment: '待履约',
    in_progress: '履约中',
    completed: '已完成',
    cancelled: '已取消',
  };
  return map[order.value.status] || '签署中';
});

function formatAmount(val: number | string | null | undefined): string {
  const n = Number(val);
  return Number.isNaN(n) ? '0' : n.toFixed(0);
}

function formatOrderTime(o: OrderApi.Order): string {
  if (o.createtime != null) {
    const d = new Date(o.createtime * 1000);
    return formatDatePart(d);
  }
  if (o.createdAt)
    return formatDatePart(new Date(o.createdAt));
  return '—';
}

function formatDatePart(d: Date): string {
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  const hh = String(d.getHours()).padStart(2, '0');
  const mm = String(d.getMinutes()).padStart(2, '0');
  return `${y}-${m}-${day} ${hh}:${mm}`;
}

function maskPhone(phone: string | null | undefined): string {
  if (!phone || !phone.trim()) return '—';
  const s = String(phone).trim();
  if (s.length >= 11)
    return s.slice(0, 3) + '****' + s.slice(-4);
  return s;
}

async function fetchData(id: number) {
  try {
    const o = await OrderApi.getOrder(id);
    order.value = normalizeOrder(o);
    if (o.productId)
      product.value = await ProductApi.getProduct(o.productId);
    else
      product.value = null;
  } catch {
    toast('加载订单详情失败');
  }
}

/**
 * 打开详情：先拉订单；若无合同 URL 则自动调用后端生成并再拉一次，保证进入页面后即可下载。
 */
async function fetchDataAndEnsureContract(id: number) {
  contractEnsurePending.value = false;
  await fetchData(id);
  if (contractFileUrl.value)
    return;

  contractEnsurePending.value = true;
  try {
    if (!contractEnsureInFlight) {
      contractEnsureInFlight = (async () => {
        try {
          await OrderApi.generateContract(id);
          await fetchData(id);
        } finally {
          contractEnsureInFlight = null;
        }
      })();
    }
    await contractEnsureInFlight;
  } catch {
    /* 拦截器通常会 toast；无合同时保留占位文案 */
  } finally {
    contractEnsurePending.value = false;
  }
}

/** 合同文件由 NestJS 的 /uploads 提供，与 VITE_API_BASE_URL 同源 */
function ensureAbsoluteUrl(url: string): string {
  if (!url) return url;
  if (url.startsWith('http://') || url.startsWith('https://')) return url;
  const base = (import.meta.env.VITE_API_BASE_URL || 'http://127.0.0.1:3000').replace(/\/$/, '');
  return `${base}/${url.replace(/^\//, '')}`;
}

function downloadContract() {
  if (!contractFileUrl.value) {
    toast('暂未上传电子合同');
    return;
  }
  const url = ensureAbsoluteUrl(contractFileUrl.value);
  uni.downloadFile({
    url,
    success() { toast('电子合同已开始下载，请在微信中查看文件'); },
    fail() { toast('下载电子合同失败'); },
  });
}

onLoad((options: any) => {
  const id = Number(options?.id);
  if (!id) {
    toast('缺少订单ID');
    return;
  }
  currentOrderId.value = id;
});

/** 进入/返回页面时拉单并确保电子合同已生成 */
onShow(() => {
  const id = currentOrderId.value;
  if (id)
    void fetchDataAndEnsureContract(id);
});
</script>

<style scoped lang="scss">
.page {
  min-height: 100vh;
  padding: 32rpx 32rpx 48rpx;
  box-sizing: border-box;
  background: linear-gradient(180deg, var(--theme-bg-gradient-start) 0%, var(--theme-bg-gradient-end) 100%);
}

.card {
  margin-bottom: 28rpx;
  padding: 32rpx 40rpx;
  border-radius: var(--theme-card-radius);
  background: #ffffff;
  box-shadow: var(--theme-card-shadow);
}

.card-header {
  padding: 28rpx 32rpx 24rpx;
}

.header-top {
  display: flex;
  justify-content: space-between;
  align-items: flex-start;
  margin-bottom: 20rpx;
}

.header-title {
  flex: 1;
  font-size: 34rpx;
  font-weight: 700;
  color: var(--theme-text-title);
  margin-right: 16rpx;
  line-height: 1.35;
}

.header-status {
  flex-shrink: 0;
  padding: 8rpx 16rpx;
  border-radius: var(--theme-btn-radius);
  font-size: 24rpx;
  font-weight: 500;
}

.status-signing,
.status-pending_contract {
  color: #007AFF;
  background: rgba(0, 122, 255, 0.1);
}

.status-pending_fulfillment,
.status-in_progress {
  color: #ff9500;
  background: #fff7ed;
}

.status-completed {
  color: #34C759;
  background: #f0fdf4;
}

.status-cancelled {
  color: #8e8e93;
  background: #f3f4f6;
}

.header-meta {
  margin-top: 8rpx;
}

.meta-row {
  display: flex;
  align-items: center;
  margin-top: 12rpx;
  font-size: 26rpx;
}

.meta-icon {
  margin-right: 10rpx;
  font-size: 28rpx;
}

.meta-label {
  color: #6b7280;
  margin-right: 12rpx;
}

.meta-value {
  color: #1b233b;
  font-weight: 500;
}

.section-title {
  display: flex;
  align-items: center;
  margin-bottom: 20rpx;
  font-size: 30rpx;
  font-weight: 600;
  color: #1b233b;
}

.section-icon {
  margin-right: 10rpx;
  font-size: 32rpx;
}

.card-content {
  padding: 28rpx 32rpx 24rpx;
}

.content-item {
  padding-bottom: 20rpx;
}

.item-name {
  font-size: 30rpx;
  font-weight: 700;
  color: #1b233b;
  margin-bottom: 8rpx;
}

.item-detail-label {
  font-size: 24rpx;
  color: #6b7280;
  margin-bottom: 6rpx;
}

.item-detail-text {
  font-size: 26rpx;
  color: #6b7280;
  line-height: 1.5;
  margin-bottom: 12rpx;
}

.item-price-row {
  display: flex;
  justify-content: space-between;
  align-items: center;
}

.item-price-qty {
  font-size: 26rpx;
  color: #1b233b;
}

.item-subtotal {
  font-size: 28rpx;
  font-weight: 600;
  color: #ef4444;
}

.item-divider {
  height: 1rpx;
  background: #e5e7eb;
  margin: 20rpx 0;
}

.content-total {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-top: 16rpx;
  padding-top: 16rpx;
  border-top: 1rpx solid #e5e7eb;
}

.total-label {
  font-size: 28rpx;
  font-weight: 600;
  color: #1b233b;
}

.total-value {
  font-size: 32rpx;
  font-weight: 700;
  color: #ef4444;
}

.info-row {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-top: 12rpx;
  font-size: 26rpx;
}

.info-label {
  color: #6b7280;
}

.info-value {
  color: #1b233b;
  font-weight: 500;
}

.contract-actions {
  display: flex;
  justify-content: center;
  margin-top: 16rpx;
}

.contract-btn {
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 20rpx 24rpx;
  border-radius: 16rpx;
  font-size: 28rpx;
  border: none;
}

.contract-btn-download {
  width: 50%;
  box-sizing: border-box;
}

.contract-btn.primary {
  background: #0A7AFF;
  color: #ffffff;
}

.contract-empty {
  margin-top: 8rpx;
}

.contract-empty-text {
  font-size: 26rpx;
  color: #6b7280;
  display: block;
}

.loading {
  display: flex;
  align-items: center;
  justify-content: center;
  min-height: 60vh;
}
</style>
