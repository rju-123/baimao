import type { LoginByCodeReq, LoginByCodeRes, LoginReq, LoginRes, ProfileReq, ProfileRes } from './types';
/**
* 用户信息相关接口
*/
import type { CommonRes } from '@/api/common/types';
import { get, post, request } from '@/utils/request';

/** 登录 */
export const login = (data: LoginReq) => post<LoginRes>('/auth/login', { data, custom: { auth: false } });

/** 获取用户信息（占位，后端暂未实现） */
export const profile = (params?: ProfileReq) => get<ProfileRes>('/user/profile', { params });

/** 验证码登录（占位，用于小程序授权登录） */
export const loginByCode = (data: LoginByCodeReq) => post<LoginByCodeRes>('/user/loginByCode', { data });

/** 退出登录（占位） */
export const logout = () => post<CommonRes>('/user/logout');

/** 更新当前用户所属公司（对接 PUT /users/:id/company） */
export const updateCompany = (userId: number, companyId: number) =>
  request<CommonRes>({
    url: `/users/${userId}/company`,
    method: 'PUT',
    data: { companyId },
  });
