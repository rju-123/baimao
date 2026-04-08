import type { LoginByCodeReq, LoginByCodeRes, LoginReq, LoginRes, ProfileReq, ProfileRes, UserInfoRes, WechatPhoneLoginReq } from './types';
/**
* 用户信息相关接口
*/
import type { CommonRes } from '@/api/common/types';
import { get, post, request } from '@/utils/request';

/** 登录 */
export const login = (data: LoginReq) => post<LoginRes>('/auth/login', { data, custom: { auth: false } });

/** 根据用户 ID 拉取最新用户信息（含积分），用于刷新本地缓存的积分等 */
export const getUser = (id: number) => get<UserInfoRes>(`/users/${id}`);

/** 获取用户信息（占位，后端暂未实现） */
export const profile = (params?: ProfileReq) => get<ProfileRes>('/user/profile', { params });

/** 验证码登录（占位，用于小程序授权登录） */
export const loginByCode = (data: LoginByCodeReq) => post<LoginByCodeRes>('/user/loginByCode', { data });

/** 退出登录（占位） */
export const logout = () => post<CommonRes>('/user/logout');

/** 微信手机号快速验证登录 */
export const wechatPhoneLogin = (data: WechatPhoneLoginReq) =>
  post<LoginRes>('/auth/wechat-phone-login', { data, custom: { auth: false } });

/** 更新当前用户所属公司与姓名（对接 PUT /users/:id/company） */
export const updateCompany = (userId: number, companyId: number, name?: string) =>
  request<CommonRes>({
    url: `/users/${userId}/company`,
    method: 'PUT',
    data: { companyId, name },
  });
