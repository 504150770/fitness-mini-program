import { request } from './request'

export interface HealthInfo { status: string; env: string; time: string }
export interface AuthUser { id: string; openid: string; nickname: string | null }
export interface LoginResult { user: AuthUser; token: string }
export interface UserProfileInfo {
  userId: string
  gender: string | null
  birthDate: string | null
  age: number | null
  heightCm: number | null
  goal: string | null
}
export interface ProfileInput {
  gender?: string | null
  birthDate?: string | null
  heightCm?: number | null
  goal?: string | null
}

export const api = {
  health: () => request<HealthInfo>({ url: '/health' }),
  devLogin: (openid: string) => request<LoginResult>({ url: '/auth/dev-login', method: 'POST', data: { openid } }),
  wxLogin: (code: string) => request<LoginResult>({ url: '/auth/wx-login', method: 'POST', data: { code } }),
  me: () => request<AuthUser>({ url: '/auth/me' }),
  testError: () => request({ url: '/this-path-does-not-exist' }),
  getProfile: () => request<UserProfileInfo | null>({ url: '/users/profile' }),
  upsertProfile: (data: ProfileInput) => request<UserProfileInfo>({ url: '/users/profile', method: 'PUT', data }),
}