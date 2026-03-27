import { get, post } from '@/utils/request';

export interface Order {
  id: number;
  orderNo: string;
  userId: number;
  companyId: number | null;
  productId: number;
  productName: string;
  productBrief: string;
  productDetail: string;
  /** 产品客户（后台创建产品时填写的 customer，订单列表“客户”展示用） */
  productCustomer?: string;
  /** 订单行明细快照（用于合并单展示多个客户/合同表格） */
  lineItemsJson?: any[] | null;
  unitPrice: number;
  customerName: string;
  customerPhone: string;
  customerCompany: string;
  /** 接单员ID（白帽子ID） */
  whitehatId?: number;
  /** 接单员姓名（白帽子姓名快照） */
  whitehatName?: string;
  /** 接单员电话（白帽子手机号快照） */
  whitehatPhone?: string;
  /** 电子合同状态 */
  contractStatus?: string;
  /** 电子合同 PDF 地址 */
  contractUrl?: string;
  quantity: number;
  amount: number;
  discountAmount: number;
  payAmount: number;
  status: string;
  /** 产品是否已售罄（由后端根据库存/状态计算） */
  productSoldOut?: boolean;
  /** 后端 MySQL 返回的 Unix 时间戳（秒） */
  createtime?: number | null;
  /** 兼容旧字段，部分环境可能为 ISO 字符串 */
  createdAt?: string;
}

export interface CreateOrderReq {
  userId: number;
  companyId?: number;
  productId: number;
  customerName: string;
  customerPhone: string;
  customerCompany: string;
  quantity: number;
  couponDiscount?: number;
}

export const createOrder = (data: CreateOrderReq) =>
  post<Order>('/orders', { data });

export const getOrder = (id: number) =>
  get<Order>(`/orders/${id}`);

/** 生成或刷新订单电子合同（详情页无合同时自动调用） */
export const generateContract = (orderId: number) =>
  post<{ contractUrl: string }>(`/orders/${orderId}/generate-contract`, { data: {} });

export interface ListOrdersParams {
  userId: number;
  status?: string;
}

/** 拉取用户订单列表，手动拼接查询串，兼容小程序运行环境 */
export const listOrders = (params: ListOrdersParams) => {
  const qs: string[] = [];
  qs.push(`userId=${encodeURIComponent(String(params.userId))}`);
  if (params.status != null && params.status !== '')
    qs.push(`status=${encodeURIComponent(params.status)}`);
  const query = qs.join('&');
  const url = query ? `/orders?${query}` : '/orders';
  return get<Order[]>(url);
};

