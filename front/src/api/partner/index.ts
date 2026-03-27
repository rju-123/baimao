import type { InvoiceStatusRes, SubmitInvoiceReq } from './types';
import { get, post } from '@/utils/request';

export const submitInvoice = (data: SubmitInvoiceReq) =>
  post<{ id: number }>('/partner/invoice', { data });

export const getInvoiceStatus = (userId: number) =>
  get<InvoiceStatusRes | null>(`/partner/invoice/${userId}`);

export const abandonInvoice = (userId: number) =>
  post<{ ok: boolean }>('/partner/invoice/abandon', { data: { userId } });
