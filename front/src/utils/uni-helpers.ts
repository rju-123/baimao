/**
 * 替代 uni.$u 的轻量工具，不依赖 uview
 */
export function toast(title: string, icon: 'success' | 'error' | 'none' = 'none') {
  let t = String(title ?? '');
  // #ifdef MP-WEIXIN
  // 微信小程序 showToast 在带 success/error 图标时可显示字符更少；
  // 文案偏长时强制使用 icon=none，避免被截断。
  let wxIcon = icon;
  if (wxIcon !== 'none' && t.length > 7)
    wxIcon = 'none';
  uni.showToast({ title: t, icon: wxIcon });
  return;
  // #endif
  uni.showToast({ title: t, icon });
}

export function route(options: { type: 'navigateTo' | 'redirectTo' | 'switchTab' | 'reLaunch'; url: string }) {
  const { type, url } = options;
  if (type === 'switchTab') {
    uni.switchTab({ url });
  }
  else if (type === 'redirectTo') {
    uni.redirectTo({ url });
  }
  else if (type === 'reLaunch') {
    uni.reLaunch({ url });
  }
  else {
    uni.navigateTo({ url });
  }
}

export const test = {
  mobile: (val: number | string) => /^1\d{10}$/.test(String(val)),
};

export function random(min: number, max: number): number {
  return Math.floor(Math.random() * (max - min + 1)) + min;
}

export const color = {
  warning: '#f0ad4e',
  primary: '#0A7AFF',
};
