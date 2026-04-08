export interface ProfileReq {
  user_id?: string;
}

export interface ProfileRes {
  user_id?: string;
  user_name?: string;
  avatar?: string;
  token?: string;
}

export interface LoginReq {
  phone: string;
  code: string;
}

/** 登录/拉取用户信息时后端返回的用户对象 */
export interface UserInfoRes {
  id: number;
  phone: string;
  name: string;
  role: string;
  isAdmin: boolean;
  companyId: number | null;
  points: number;
  companyName?: string | null;
}

export interface LoginRes {
  token: string;
  user: UserInfoRes;
}

export interface LoginByCodeReq {
  code: string;
}

export interface LoginByCodeRes {
  [key: string]: any;
}

/** 微信手机号快速验证登录请求体 */
export interface WechatPhoneLoginReq {
  code: string;
}
