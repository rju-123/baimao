import { Injectable } from '@nestjs/common';

interface WechatTokenCache {
  token: string;
  expireAt: number;
}

@Injectable()
export class WechatService {
  private cache: WechatTokenCache | null = null;

  private get appId(): string {
    const raw = process.env.WX_MP_APPID || process.env.WECHAT_MINI_APPID || '';
    return typeof raw === 'string' ? raw.trim() : '';
  }

  private get secret(): string {
    const raw = process.env.WX_MP_SECRET || process.env.WECHAT_MINI_SECRET || '';
    return typeof raw === 'string' ? raw.trim() : '';
  }

  private assertConfig() {
    if (!this.appId || !this.secret)
      throw new Error('微信小程序 appid/secret 未配置，请在环境变量 WX_MP_APPID/WX_MP_SECRET 中设置');
  }

  private async requestJson<T>(url: string, init?: any): Promise<T> {
    const f: any = (global as any).fetch;
    if (!f)
      throw new Error('当前运行环境不支持 fetch，请使用 Node.js 18+ 或手动引入 fetch polyfill');
    const res = await f(url, init);
    if (!res.ok)
      throw new Error(`请求微信接口失败: ${res.status} ${res.statusText}`);
    return res.json() as Promise<T>;
  }

  async getAccessToken(): Promise<string> {
    this.assertConfig();
    const now = Date.now();
    if (this.cache && this.cache.expireAt > now + 60_000)
      return this.cache.token;

    const url = `https://api.weixin.qq.com/cgi-bin/token?grant_type=client_credential&appid=${encodeURIComponent(this.appId)}&secret=${encodeURIComponent(this.secret)}`;
    // 临时调试日志，确认实际使用的 appid/secret 与返回内容
    // 注意：如有安全顾虑，可以只保留 appid 或对 secret 做部分打码
    // eslint-disable-next-line no-console
    console.log('[WechatService] getAccessToken url =', url);
    const data: any = await this.requestJson(url);
    // eslint-disable-next-line no-console
    console.log('[WechatService] getAccessToken response =', data);
    if (!data || !data.access_token) {
      const msg = data?.errmsg || '未知错误';
      throw new Error(`获取微信 access_token 失败: ${msg}`);
    }
    const expiresIn = Number(data.expires_in || 7200);
    this.cache = {
      token: data.access_token,
      expireAt: now + (expiresIn - 120) * 1000,
    };
    return this.cache.token;
  }

  /** 通过微信手机号快速验证组件返回的 code 换取完整手机号 */
  async getPhoneNumberByCode(code: string): Promise<string> {
    const raw = String(code ?? '').trim();
    if (!raw)
      throw new Error('缺少微信手机号授权 code');
    const accessToken = await this.getAccessToken();
    const url = `https://api.weixin.qq.com/wxa/business/getuserphonenumber?access_token=${encodeURIComponent(accessToken)}`;
    const data: any = await this.requestJson(url, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ code: raw }),
    });
    if (data.errcode) {
      const msg = data.errmsg || '未知错误';
      // 1400001 等错误码为资源包不足 / 权限问题
      throw new Error(`微信手机号获取失败: [${data.errcode}] ${msg}`);
    }
    const phone = data?.phone_info?.phoneNumber;
    if (!phone)
      throw new Error('微信未返回手机号，请稍后重试');
    return String(phone);
  }
}

