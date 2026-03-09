import { get } from '@/utils/request';

export interface Product {
  id: number;
  name: string;
  type: 'service' | 'product';
  category: string;
  brief: string;
  detail: string;
  price: number;
  discountPrice: number | null;
  status: 'active' | 'expired' | string;
  inventory?: number;
  deliveryTime?: string | null;
}

export const listProducts = (query?: { type?: string; status?: string }) => {
  const params: string[] = [];
  if (query?.type)
    params.push(`type=${encodeURIComponent(query.type)}`);
  if (query?.status)
    params.push(`status=${encodeURIComponent(query.status)}`);
  const q = params.join('&');
  const url = q ? `/products?${q}` : '/products';
  return get<Product[]>(url);
};

export const getProduct = (id: number) =>
  get<Product>(`/products/${id}`);

