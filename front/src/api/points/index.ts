import { get, post } from '@/utils/request';

export interface PointsMallItem {
  id: number;
  name: string;
  /**
   * physical / virtual
   */
  type: 'physical' | 'virtual';
  description: string;
  pointsRequired: number;
  stock: number;
  image?: string;
}

export interface ExchangeRecord {
  id: number;
  userId: number;
  itemId: number;
  /**
   * 商品名称（由后端拼接返回，用于前端展示）
   */
  itemName?: string;
  quantity: number;
  pointsSpent: number;
  /**
   * 实体商品收货地址快照（JSON 字符串或纯文本）
   */
  addressSnapshot: string | null;
  /**
   * 兑换种类：physical / virtual
   */
  kind: 'physical' | 'virtual';
  /**
   * 发货状态：pending_shipment / shipped / received / completed
   */
  status: string;
  /**
   * 虚拟商品券码
   */
  code: string | null;
  createdAt: string;
}

export interface CreateExchangeReq {
  userId: number;
  itemId: number;
  quantity: number;
  addressSnapshot?: string;
}

export const listMallItems = (type?: 'physical' | 'virtual') => {
  const qs: string[] = [];
  if (type)
    qs.push(`type=${encodeURIComponent(type)}`);
  const url = qs.length > 0 ? `/points/mall-items?${qs.join('&')}` : '/points/mall-items';
  return get<PointsMallItem[]>(url);
};

export const getMallItem = (id: number) =>
  get<PointsMallItem>(`/points/mall-items/${id}`);

export const listExchangeRecords = (userId: number) =>
  get<ExchangeRecord[]>(`/points/exchange-records?userId=${encodeURIComponent(String(userId))}`);

export const getExchangeRecord = (id: number) =>
  get<ExchangeRecord>(`/points/exchange-records/${id}`);

export const exchangeItem = (data: CreateExchangeReq) =>
  post<ExchangeRecord>('/points/exchange', { data });

