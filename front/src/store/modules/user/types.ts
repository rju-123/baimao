export type RoleType = '' | '*' | 'user';
export interface UserState {
  user_id?: string;
  user_name?: string;
  phone?: string;
  companyId?: number | null;
  companyName?: string;
  /** 是否为当前公司管理员（后端 isAdmin 字段） */
  isAdmin?: boolean;
  avatar?: string;
  token?: string;
  /**
   * 当前小程序中的角色选择：sales / partner
   */
  currentRole?: 'sales' | 'partner' | '';
  /**
   * 当前积分
   */
  points?: number;
}

export type providerType
  = | 'weixin'
    | 'qq'
    | 'sinaweibo'
    | 'xiaomi'
    | 'apple'
    | 'univerify'
    | undefined;
