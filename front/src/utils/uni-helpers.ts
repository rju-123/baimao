/**
 * 替代 uni.$u 的轻量工具，不依赖 uview
 */
export function toast(title: string, icon: 'success' | 'error' | 'none' = 'none') {
  uni.showToast({ title, icon });
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
