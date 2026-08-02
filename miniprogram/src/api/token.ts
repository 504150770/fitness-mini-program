const KEY = 'fitness_token'
export function getToken(): string {
  try { return uni.getStorageSync(KEY) as string || '' } catch { return '' }
}
export function setToken(t: string) { uni.setStorageSync(KEY, t) }
export function clearToken() { uni.removeStorageSync(KEY) }