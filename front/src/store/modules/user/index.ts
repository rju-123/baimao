import type { providerType, UserState } from './types';
import type { LoginReq } from '@/api/user/types';
import { defineStore } from 'pinia';
import { UserApi } from '@/api';

import { clearToken, setToken } from '@/utils/auth';

const useUserStore = defineStore('user', {
  state: (): UserState => ({
    user_id: '',
    user_name: '江阳小道',
    avatar: '',
    token: '',
    currentRole: '',
  }),
  getters: {
    userInfo(state: UserState): UserState {
      return { ...state };
    },
  },
  actions: {
    // 设置用户的信息
    setInfo(partial: Partial<UserState>) {
      this.$patch(partial);
    },
    // 重置用户信息
    resetInfo() {
      this.$reset();
    },
    // 获取用户信息
    async info() {
      const result = await UserApi.profile();
      this.setInfo(result);
    },
    /** 根据当前 user_id 从后端拉取最新用户信息（含积分），更新 store */
    async refreshUserInfo() {
      const id = this.user_id;
      if (!id)
        return;
      try {
        const user = await UserApi.getUser(Number(id));
        this.setInfo({
          user_name: user.name || user.phone,
          phone: user.phone,
          companyId: user.companyId ?? undefined,
          points: user.points ?? 0,
        });
      }
      catch (e) {
        console.warn('refreshUserInfo failed', e);
      }
    },
    // 异步登录并存储token
    login(loginForm: LoginReq) {
      return new Promise((resolve, reject) => {
        UserApi.login(loginForm).then((res) => {
          const token = res.token;
          if (token) {
            setToken(token);
          }
          // 同步基础用户信息到 store，方便前端使用
          this.setInfo({
            user_id: String(res.user.id),
            user_name: res.user.name || res.user.phone,
            phone: res.user.phone,
            companyId: res.user.companyId,
            // 积分余额（若后端暂未返回则回退为 0）
            points: (res.user as any).points ?? 0,
            token,
            // 默认使用后端角色作为当前角色，后续在角色选择页可再覆盖
            currentRole: (res.user.role as any) || 'sales',
          });
          resolve(res);
        }).catch((error) => {
          reject(error);
        });
      });
    },
    // Logout
    async logout() {
      await UserApi.logout();
      this.resetInfo();
      clearToken();
    },
    // 小程序授权登录（微信快捷登录，当前阶段不依赖后端 loginByCode 接口）
    authLogin(provider: providerType = 'weixin') {
      return new Promise((resolve, reject) => {
        uni.login({
          provider,
          success: (_result: UniApp.LoginRes) => {
            // 当前后端未实现 /user/loginByCode，使用本地模拟登录，避免 404
            const mockUserId = this.user_id || String(Date.now());
            const mockToken = this.token || 'quick-login';

            setToken(mockToken);

            this.setInfo({
              user_id: mockUserId,
              user_name: this.user_name || '快捷登录用户',
              token: mockToken,
              currentRole: this.currentRole || 'sales',
            });

            resolve({
              token: mockToken,
              user: {
                id: Number(mockUserId),
                name: this.user_name || '快捷登录用户',
              },
            });
          },
          fail: (err: any) => {
            console.error(`login error: ${err}`);
            reject(err);
          },
        });
      });
    },
  },
  persist: true,
});

export default useUserStore;
