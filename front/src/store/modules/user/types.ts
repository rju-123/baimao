export type RoleType = '' | '*' | 'user';
export interface UserState {
  user_id?: string;
  user_name?: string;
  phone?: string;
  companyId?: number | null;
  companyName?: string;
  avatar?: string;
  token?: string;
  /**
   * 当前小程序中的角色选择：sales / partner
   */
  currentRole?: 'sales' | 'partner' | '';
}

export type providerType
  = | 'weixin'
    | 'qq'
    | 'sinaweibo'
    | 'xiaomi'
    | 'apple'
    | 'univerify'
    | undefined;
