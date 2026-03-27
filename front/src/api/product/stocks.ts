import { get } from '@/utils/request';

export interface ProductStock {
  id: number;
  inventory: number;
  status: string;
  soldOut: boolean;
}

export const getProductStocks = (ids: number[]) => {
  const clean = (ids || [])
    .map(i => Number(i))
    .filter(i => Number.isFinite(i) && i > 0);
  const qs = clean.length ? `ids=${encodeURIComponent(clean.join(','))}` : 'ids=';
  return get<ProductStock[]>(`/products/stocks?${qs}`);
};

