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
export interface BodyRecord {
  id: string
  userId: string
  recordedAt: string
  weightKg: number
  bodyFatPct: number | null
  photoUrl: string | null
  note: string | null
}
export interface BodyRecordInput {
  weightKg: number
  bodyFatPct?: number | null
  note?: string | null
  recordedAt?: string | null
}
export interface BodyTrendPoint {
  date: string
  weightKg: number
}

export const api = {
  health: () => request<HealthInfo>({ url: '/health' }),
  devLogin: (openid: string) => request<LoginResult>({ url: '/auth/dev-login', method: 'POST', data: { openid } }),
  wxLogin: (code: string) => request<LoginResult>({ url: '/auth/wx-login', method: 'POST', data: { code } }),
  me: () => request<AuthUser>({ url: '/auth/me' }),
  testError: () => request({ url: '/this-path-does-not-exist' }),
  getProfile: () => request<UserProfileInfo | null>({ url: '/users/profile' }),
  upsertProfile: (data: ProfileInput) => request<UserProfileInfo>({ url: '/users/profile', method: 'PUT', data }),

  getBodyRecords: (params?: { from?: string; to?: string; limit?: number }) =>
    request<BodyRecord[]>({ url: '/body/records', method: 'GET', data: params }),
  createBodyRecord: (data: BodyRecordInput) =>
    request<BodyRecord>({ url: '/body/records', method: 'POST', data }),
  getBodyLatest: () => request<BodyRecord | null>({ url: '/body/latest' }),
  getBodyTrend: (limit?: number) =>
    request<BodyTrendPoint[]>({ url: '/body/trend', method: 'GET', data: limit ? { limit } : undefined }),
}