import type { Request } from './http';
import { useUserStore } from '@/store';
import { getToken } from '@/utils/auth';
import storage from '@/utils/storage';
import { showMessage } from './status';

let requestQueue: (() => void)[] = [];

const repeatSubmit = (config: any) => {
  const requestObj = {
    url: config.url,
    data: typeof config.data === 'object' ? JSON.stringify(config.data) : config.data,
    time: Date.now(),
  };
  const sessionObj = storage.getJSON('sessionObj');
  if (!sessionObj) {
    storage.setJSON('sessionObj', requestObj);
  }
  else {
    const s_url = sessionObj.url;
    const s_data = sessionObj.data;
    const s_time = sessionObj.time;
    const interval = 1000;
    if (s_data === requestObj.data && requestObj.time - s_time < interval && s_url === requestObj.url) {
      return Promise.reject(new Error('数据正在处理，请勿重复提交'));
    }
    storage.setJSON('sessionObj', requestObj);
  }
};

let isRefreshing = false;

const refreshToken = async (http: Request, config: any) => {
  if (!isRefreshing) {
    isRefreshing = true;
    await useUserStore().authLogin();
    requestQueue.forEach(cb => cb());
    requestQueue = [];
    isRefreshing = false;
    return http.request(config);
  }
  return new Promise<any>((resolve) => {
    requestQueue.push(() => resolve(http.request(config)));
  });
};

function requestInterceptors(http: Request) {
  http.interceptors.request.use(
    (config: any) => {
      config.data = config.data || {};
      config.header = config.header || {};
      const custom = config?.custom;
      if (getToken() && custom?.auth !== false) {
        config.header.token = getToken();
      }

      // 避免 GET 请求命中 ETag 导致 304（我们的请求封装无法复用缓存体）
      if (config.method === 'GET') {
        config.header['Cache-Control'] = 'no-cache';
        config.header.Pragma = 'no-cache';
      }

      if (custom?.loading) {
        uni.showLoading({ title: '加载中', mask: true });
      }
      if (custom?.repeatSubmit !== false && (config.method === 'POST' || config.method === 'UPLOAD')) {
        repeatSubmit(config);
      }
      return config;
    },
  );
}

function responseInterceptors(http: Request) {
  http.interceptors.response.use(
    (response: any) => {
      const data = response.data;
      const config = response.config;
      const custom = config?.custom;

      if (data?.code === 401) {
        return refreshToken(http, config);
      }

      if (custom?.loading) {
        uni.hideLoading();
      }

      if (data?.code === 200) {
        return response || {};
      }

      if (custom?.toast !== false) {
        uni.showToast({ title: data?.message || '请求失败', icon: 'none' });
      }

      return Promise.reject(data);
    },
    (response: any) => {
      const custom = response.config?.custom;
      if (custom?.loading !== false) {
        uni.hideLoading();
      }
      if (custom?.toast !== false) {
        const wxErr = typeof response?.errMsg === 'string' ? response.errMsg : '';
        const hint
          = wxErr.includes('domain')
          || wxErr.includes('域名')
          || wxErr.includes('url not in domain')
          ? '请在微信公众平台配置 request 合法域名，并使用 HTTPS 备案域名（真机不支持未配置的 http/IP）'
          : '';
        const message = hint
          || wxErr
          || (response.statusCode ? showMessage(response.statusCode) : '')
          || '网络连接异常,请稍后再试!';
        uni.showToast({ title: message.length > 40 ? `${message.slice(0, 40)}…` : message, icon: 'none', duration: 3500 });
      }
      return Promise.reject(response);
    },
  );
}

export { requestInterceptors, responseInterceptors };
