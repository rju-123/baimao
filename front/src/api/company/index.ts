import { get, post } from '@/utils/request';

export interface Company {
  id: number;
  name: string;
  creditCode: string;
  address: string;
  contactName: string;
  contactPhone: string;
}

export const listCompanies = () => get<Company[]>('/companies');

export interface CompanyDashboard {
  id: number;
  name: string;
  teamCount: number;
  totalOrders: number;
  couponCount: number;
}

export interface CompanyMember {
  id: number;
  name?: string;
  phone?: string;
  isAdmin?: boolean;
  createtime?: number | null;
  totalOrders?: number;
}

export const getCompanyDashboard = (id: number) =>
  get<CompanyDashboard>(`/companies/${id}/dashboard`);

export const listCompanyMembers = (id: number) =>
  get<CompanyMember[]>(`/companies/${id}/members`);

export const removeCompanyMember = (companyId: number, memberId: number) =>
  post<boolean>(`/companies/${companyId}/members/${memberId}/remove`, { data: {} });

export const transferCompanyAdmin = (companyId: number, memberId: number) =>
  post<boolean>(`/companies/${companyId}/members/${memberId}/transfer-admin`, { data: {} });

export interface CreateCompanyDto {
  name: string;
  creditCode: string;
  address: string;
  contactName: string;
  contactPhone: string;
}

export const createCompany = (data: CreateCompanyDto) =>
  post<Company>('/companies', { data });

