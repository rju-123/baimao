import { Request } from './http';
import type { IResponse } from './types';
import { requestInterceptors, responseInterceptors } from './interceptors';

const http = new Request();

export function setupRequest() {
  http.setConfig((defaultConfig: any) => {
    defaultConfig.baseURL = import.meta.env.VITE_API_BASE_URL;
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
      const { result } = res.data as IResponse<T>;
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
