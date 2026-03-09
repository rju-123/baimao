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

export interface LoginRes {
  token: string;
  user: {
    id: number;
    phone: string;
    name: string;
    role: string;
    isAdmin: boolean;
    companyId: number | null;
    points: number;
  };
}

export interface LoginByCodeReq {
  code: string;
}

export interface LoginByCodeRes {
  [key: string]: any;
}
