const TokenKey = 'admin-token';
const TokenPrefix = 'Bearer ';
function isLogin() {
  return !!uni.getStorageSync(TokenKey);
}
function getToken() {
  return uni.getStorageSync(TokenKey);
}
function setToken(token: string) {
  uni.setStorageSync(TokenKey, token);
}
function clearToken() {
  uni.removeStorageSync(TokenKey);
}

/** 从登录下发的 mock-token-{数字ID} 解析用户 ID（store 未持久化 user_id 时的兜底） */
function parseUserIdFromMockToken(token: unknown): number {
  if (typeof token !== 'string' || !token)
    return 0;
  const m = token.match(/^mock-token-(\d+)$/);
  if (!m)
    return 0;
  const n = Number(m[1]);
  return Number.isFinite(n) && n > 0 ? n : 0;
}

export { clearToken, getToken, isLogin, parseUserIdFromMockToken, setToken, TokenPrefix };
