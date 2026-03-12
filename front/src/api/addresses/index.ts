import { get, post, request } from '@/utils/request';

export interface AddressItem {
  id: number;
  userId: number;
  receiverName: string;
  receiverPhone: string;
  region: string;
  detail: string;
  isDefault: boolean;
  createdAt: string;
}

export interface SaveAddressReq {
  receiverName: string;
  receiverPhone: string;
  region: string;
  detail: string;
  isDefault?: boolean;
}

export const listAddresses = (userId: number) =>
  get<AddressItem[]>(`/addresses?userId=${encodeURIComponent(String(userId))}`);

export const createAddress = (userId: number, data: SaveAddressReq) =>
  post<AddressItem>('/addresses', {
    data: {
      ...data,
      userId,
    },
  });

export const updateAddress = (id: number, data: SaveAddressReq) =>
  request<AddressItem>({
    url: `/addresses/${id}`,
    method: 'PUT',
    data,
  });

export const deleteAddress = (id: number) =>
  request<boolean>({
    url: `/addresses/${id}`,
    method: 'DELETE',
  });

