import type { providerType, UserState } from './types';
import type { LoginReq } from '@/api/user/types';
import { defineStore } from 'pinia';
import { UserApi } from '@/api';

import { clearToken, setToken } from '@/utils/auth';

const useUserStore = defineStore('user', {
  state: (): UserState => ({
    user_id: '',
    user_name: '',
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
    /**
     * 规范化 user_id，避免历史缓存为 13 位时间戳导致后端查询/落库异常
     */
    normalizeUserId() {
      const raw = Number(this.user_id || 0);
      // MySQL int unsigned max: 4294967295
      if (!Number.isFinite(raw) || raw <= 0) {
        this.setInfo({ user_id: '', partnerRejectedAcknowledged: false });
        return;
      }
      if (raw > 4294967295) {
        // 兼容历史缓存为毫秒时间戳（13 位），转换为秒级时间戳（10 位）
        const sec = Math.floor(raw / 1000);
        const safe = sec > 0 && sec <= 4294967295 ? String(sec) : '';
        this.setInfo({ user_id: safe, partnerRejectedAcknowledged: false });
      }
    },
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
      this.normalizeUserId();
      const id = this.user_id;
      if (!id)
        return;
      try {
        const user = await UserApi.getUser(Number(id));
        const nameTrim = user.name != null ? String(user.name).trim() : '';
        const phoneTrim = user.phone != null ? String(user.phone).trim() : '';
        this.setInfo({
          user_id: String(user.id),
          user_name: nameTrim || (this.user_name != null ? String(this.user_name).trim() : ''),
          phone: phoneTrim || (this.phone != null ? String(this.phone).trim() : ''),
          companyId: user.companyId ?? undefined,
          isAdmin: (user as any).isAdmin ?? false,
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
            // user_name 用于展示“姓名”；手机号单独放在 phone 字段
            user_name: res.user.name || '',
            phone: res.user.phone,
            companyId: res.user.companyId,
            isAdmin: res.user.isAdmin,
            // 积分余额（若后端暂未返回则回退为 0）
            points: (res.user as any).points ?? 0,
            token,
            // 默认使用后端角色作为当前角色，后续在角色选择页可再覆盖
            currentRole: (res.user.role as any) || 'sales',
          });
          this.normalizeUserId();
          resolve(res);
        }).catch((error) => {
          reject(error);
        });
      });
    },
    /** 微信手机号快速验证登录：使用微信返回的 code 调用后端 /auth/wechat-phone-login */
    async wechatPhoneLogin(code: string) {
      const raw = String(code ?? '').trim();
      if (!raw)
        throw new Error('缺少微信手机号授权 code');
      const res = await UserApi.wechatPhoneLogin({ code: raw });
      const token = res.token;
      if (token)
        setToken(token);
      this.setInfo({
        user_id: String(res.user.id),
        user_name: res.user.name || '',
        phone: res.user.phone,
        companyId: res.user.companyId,
        isAdmin: res.user.isAdmin,
        points: (res.user as any).points ?? 0,
        token,
        currentRole: (res.user.role as any) || 'sales',
      });
      this.normalizeUserId();
      return res;
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
            this.normalizeUserId();
            // 快捷登录：给一个合法范围内的“秒级时间戳”作为临时 user_id，避免所有人共享同一个 id
            const mockUserId = this.user_id || String(Math.floor(Date.now() / 1000));
            const mockToken = this.token || 'quick-login';

            setToken(mockToken);

            this.setInfo({
              user_id: mockUserId,
              user_name: this.user_name || '快捷登录用户',
              token: mockToken,
              // 强制回到身份选择页，不沿用上次角色，避免直接跳入 partner 的 rejected/pending 页面
              currentRole: '',
              partnerRejectedAcknowledged: false,
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
