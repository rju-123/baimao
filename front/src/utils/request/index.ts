import { Request } from './http';
import type { IResponse } from './types';
import { requestInterceptors, responseInterceptors } from './interceptors';

const http = new Request();

/** 小程序/部分环境对 localhost 解析不稳定，统一为 IPv4 环回 */
function normalizeApiBaseUrl(raw: string | undefined): string {
  if (!raw || typeof raw !== 'string')
    return '';
  let u = raw.trim();
  if (!u)
    return '';
  u = u.replace(/^http:\/\/localhost/i, 'http://127.0.0.1');
  u = u.replace(/^https:\/\/localhost/i, 'https://127.0.0.1');
  return u;
}

export function setupRequest() {
  http.setConfig((defaultConfig: any) => {
    defaultConfig.baseURL = normalizeApiBaseUrl(import.meta.env.VITE_API_BASE_URL);
    // #ifdef MP-WEIXIN
    {
      const b = String(defaultConfig.baseURL || '');
      if (b && (b.startsWith('http://') || /:\/\/\d{1,3}\./.test(b))) {
        // eslint-disable-next-line no-console
        console.warn(
          '[API] 当前为 http 或 IP 地址，微信体验版/真机将拦截请求。请使用 HTTPS 备案域名，并在公众平台配置 request 合法域名。',
          b,
        );
      }
    }
    // #endif
    // #ifdef H5
    if (import.meta.env.VITE_APP_PROXY === 'true') {
      defaultConfig.baseURL = import.meta.env.VITE_API_PREFIX;
    }
    // #endif
    return defaultConfig;
  });
  requestInterceptors(http);
  responseInterceptors(http);
}

export function request<T = any>(config: any): Promise<T> {
  return new Promise((resolve, reject) => {
    http.request(config).then((res: any) => {
      const { result } = (res?.data || {}) as IResponse<T>;
      resolve(result as T);
    }).catch(reject);
  });
}

export function get<T = any>(url: string, config?: any): Promise<T> {
  return request({ ...config, url, method: 'GET' });
}

export function post<T = any>(url: string, config?: any): Promise<T> {
  return request({ ...config, url, method: 'POST' });
}

export function upload<T = any>(url: string, config?: any): Promise<T> {
  return request({ ...config, url, method: 'UPLOAD' });
}

export function download<T = any>(url: string, config?: any): Promise<T> {
  return request({ ...config, url, method: 'DOWNLOAD' });
}

export default setupRequest;
