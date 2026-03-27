/**
 * 轻量请求封装，替代 uview 的 luch-request，基于 uni.request
 */
type HttpRequestConfig = {
  url?: string;
  method?: keyof typeof methods;
  data?: any;
  header?: Record<string, string>;
  custom?: { auth?: boolean; loading?: boolean; toast?: boolean; repeatSubmit?: boolean };
};

type HttpResponse<T = any> = { data: T; statusCode: number; config: HttpRequestConfig };

const methods = { GET: 'GET', POST: 'POST', PUT: 'PUT', DELETE: 'DELETE', PATCH: 'PATCH', UPLOAD: 'UPLOAD', DOWNLOAD: 'DOWNLOAD' };

export class Request {
  config: HttpRequestConfig & { baseURL?: string } = {};
  interceptors = {
    request: {
      use: (onFulfilled?: (c: HttpRequestConfig) => HttpRequestConfig | Promise<HttpRequestConfig>, _onRejected?: (c: any) => any) => {
        this._reqFulfilled = onFulfilled;
      },
    },
    response: {
      use: (onFulfilled?: (r: HttpResponse) => any, onRejected?: (e: any) => any) => {
        this._resFulfilled = onFulfilled;
        this._resRejected = onRejected;
      },
    },
  };

  private _reqFulfilled?: (c: HttpRequestConfig) => HttpRequestConfig | Promise<HttpRequestConfig>;
  private _resFulfilled?: (r: HttpResponse) => any;
  private _resRejected?: (e: any) => any;

  setConfig(fn: (c: HttpRequestConfig) => HttpRequestConfig) {
    this.config = fn(this.config) || this.config;
  }

  async request(config: HttpRequestConfig): Promise<HttpResponse> {
    let cfg = { ...this.config, ...config };
    if (this._reqFulfilled)
      cfg = await Promise.resolve(this._reqFulfilled(cfg)) || cfg;

    const baseURL = (this.config as any).baseURL || '';
    const url = (cfg.url?.startsWith('http') ? cfg.url : `${baseURL}${cfg.url || ''}`) as string;
    const method = (cfg.method || 'GET') as string;

    return new Promise((resolve, reject) => {
      if (method === 'UPLOAD') {
        const filePath = (cfg as any).filePath ?? (cfg.data as any)?.filePath;
        const name = (cfg as any).name ?? (cfg.data as any)?.name ?? 'file';
        if (!filePath) {
          reject(new Error('UPLOAD requires filePath in data'));
          return;
        }
        const token = (cfg.header as any)?.token;
        uni.uploadFile({
          url,
          filePath,
          name,
          header: token ? { token } : {},
          timeout: 60000,
          success: (res) => {
            const data = typeof res.data === 'string' ? JSON.parse(res.data || '{}') : (res.data || {});
            const response: HttpResponse = { data, statusCode: res.statusCode || 0, config: cfg };
            if (this._resFulfilled) {
              Promise.resolve(this._resFulfilled(response)).then(resolve).catch(reject);
            }
            else {
              resolve(response);
            }
          },
          fail: (err) => {
            const response = { data: null, statusCode: 0, config: cfg, ...err };
            if (this._resRejected) {
              Promise.resolve(this._resRejected(response)).catch(reject);
            }
            else {
              reject(response);
            }
          },
        });
        return;
      }
      if (method === 'DOWNLOAD') {
        reject(new Error('DOWNLOAD not implemented in this wrapper'));
        return;
      }
      uni.request({
        url,
        method: method as any,
        data: cfg.data,
        header: { 'Content-Type': 'application/json', ...cfg.header },
        timeout: 60000,
        success: (res) => {
          const response: HttpResponse = { data: res.data as any, statusCode: res.statusCode || 0, config: cfg };
          if (this._resFulfilled) {
            Promise.resolve(this._resFulfilled(response)).then(resolve).catch(reject);
          }
          else {
            resolve(response);
          }
        },
        fail: (err) => {
          const response = { data: null, statusCode: 0, config: cfg, ...err };
          if (this._resRejected) {
            Promise.resolve(this._resRejected(response)).catch(reject);
          }
          else {
            reject(response);
          }
        },
      });
    });
  }
}
