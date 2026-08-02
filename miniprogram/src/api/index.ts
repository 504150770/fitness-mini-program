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
export interface BodyTrendPoint { date: string; weightKg: number }

export interface ExerciseInfo {
  id: string
  name: string
  category: string
  muscleGroup: string | null
  isSystem: boolean
  creatorId: string | null
}
export interface ExerciseInput {
  name: string
  category: string
  muscleGroup?: string
}
export interface PlanExercise {
  id: string
  exerciseId: string
  exerciseName: string
  category: string
  sets: number
  reps: string
  weightKg: number | null
  sortOrder: number
  note: string | null
}
export interface PlanInfo {
  id: string
  name: string
  note: string | null
  sortOrder: number
  exercises: PlanExercise[]
}
export interface PlanExerciseInput {
  exerciseId: string
  sets?: number
  reps?: string
  weightKg?: number
  note?: string
}

export const EXERCISE_CATEGORIES = [
  { value: 'CHEST', label: '胸' },
  { value: 'BACK', label: '背' },
  { value: 'SHOULDER', label: '肩' },
  { value: 'LEG', label: '腿' },
  { value: 'ARM', label: '手臂' },
  { value: 'CORE', label: '核心' },
]

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

  getExercises: (params?: { category?: string; search?: string }) =>
    request<ExerciseInfo[]>({ url: '/exercises', method: 'GET', data: params }),
  createExercise: (data: ExerciseInput) =>
    request<ExerciseInfo>({ url: '/exercises', method: 'POST', data }),
  updateExercise: (id: string, data: Partial<ExerciseInput>) =>
    request<ExerciseInfo>({ url: '/exercises/' + id, method: 'PUT', data }),
  deleteExercise: (id: string) =>
    request({ url: '/exercises/' + id, method: 'DELETE' }),

  getPlans: () => request<PlanInfo[]>({ url: '/plans' }),
  createPlan: (data: { name: string; note?: string }) =>
    request<PlanInfo>({ url: '/plans', method: 'POST', data }),
  updatePlan: (id: string, data: { name?: string; note?: string }) =>
    request<PlanInfo>({ url: '/plans/' + id, method: 'PUT', data }),
  deletePlan: (id: string) =>
    request({ url: '/plans/' + id, method: 'DELETE' }),
  addPlanExercise: (planId: string, data: PlanExerciseInput) =>
    request<PlanExercise>({ url: '/plans/' + planId + '/exercises', method: 'POST', data }),
  updatePlanExercise: (planId: string, itemId: string, data: Partial<PlanExerciseInput>) =>
    request<PlanExercise>({ url: '/plans/' + planId + '/exercises/' + itemId, method: 'PUT', data }),
  removePlanExercise: (planId: string, itemId: string) =>
    request({ url: '/plans/' + planId + '/exercises/' + itemId, method: 'DELETE' }),
  reorderPlanExercises: (planId: string, items: { id: string; sortOrder: number }[]) =>
    request<PlanInfo>({ url: '/plans/' + planId + '/reorder', method: 'PUT', data: { items } }),
}