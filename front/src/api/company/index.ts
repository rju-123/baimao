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

export interface CreateCompanyDto {
  name: string;
  creditCode: string;
  address: string;
  contactName: string;
  contactPhone: string;
}

export const createCompany = (data: CreateCompanyDto) =>
  post<Company>('/companies', { data });

