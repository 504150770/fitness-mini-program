import { request } from './request'

export interface HealthInfo { status: string; env: string; time: string }
export interface AuthUser { id: string; openid: string; nickname: string | null }
export interface LoginResult { user: AuthUser; token: string }
export interface UserProfileInfo { userId: string; gender: string | null; birthDate: string | null; age: number | null; heightCm: number | null; goal: string | null; dailyCalorieGoal: number | null; dailyProteinGoal: number | null; weeklyTrainGoal: number | null; targetWeightKg: number | null }
export interface ProfileInput { gender?: string | null; birthDate?: string | null; heightCm?: number | null; goal?: string | null; dailyCalorieGoal?: number | null; dailyProteinGoal?: number | null; weeklyTrainGoal?: number | null; targetWeightKg?: number | null }
export interface BodyRecord { id: string; userId: string; recordedAt: string; weightKg: number; bodyFatPct: number | null; photoUrl: string | null; note: string | null }
export interface BodyRecordInput { weightKg: number; bodyFatPct?: number | null; note?: string | null; recordedAt?: string | null }
export interface BodyTrendPoint { date: string; weightKg: number }
export interface ExerciseInfo { id: string; name: string; category: string; muscleGroup: string | null; isSystem: boolean; creatorId: string | null }
export interface ExerciseInput { name: string; category: string; muscleGroup?: string }
export interface PlanExercise { id: string; exerciseId: string; exerciseName: string; category: string; sets: number; reps: string; weightKg: number | null; sortOrder: number; note: string | null }
export interface PlanInfo { id: string; name: string; note: string | null; sortOrder: number; exercises: PlanExercise[] }
export interface PlanExerciseInput { exerciseId: string; sets?: number; reps?: string; weightKg?: number; note?: string }
export interface SessionLog { id: string; exerciseId: string; exerciseName: string; setOrder: number; weightKg: number; reps: number; volumeKg: number; isPR: boolean; note: string | null }
export interface SessionInfo { id: string; planId: string | null; planName: string | null; name: string; startedAt: string; endedAt: string | null; status: string; totalVolumeKg: number; note: string | null; logs: SessionLog[] }
export interface SessionListItem { id: string; name: string; planName: string | null; startedAt: string; endedAt: string | null; status: string; totalVolumeKg: number; logCount: number }
export interface PlannedExercise { exerciseId: string; exerciseName: string; category: string; sets: number; reps: string; weightKg: number | null }
export interface StartSessionResult { session: SessionInfo; plannedExercises: PlannedExercise[] }
export interface PersonalRecordInfo { id: string; exerciseId: string; exerciseName: string; maxWeightKg: number; maxWeightReps: number; achievedAt: string }
export interface DietRecord { id: string; mealType: string; foodName: string; caloriesKcal: number; proteinG: number | null; carbsG: number | null; fatG: number | null; recordedAt: string; note: string | null }
export interface DietRecordInput { mealType: string; foodName: string; caloriesKcal: number; proteinG?: number; carbsG?: number; fatG?: number; note?: string }
export interface DietSummary { records: DietRecord[]; caloriesKcal: number; proteinG: number; carbsG: number; fatG: number; recordCount: number }
export interface CheckInStatus { hasTraining: boolean; hasDiet: boolean }
export interface HomeGoals { dailyCalorieGoal: number | null; dailyProteinGoal: number | null; weeklyTrainGoal: number | null; targetWeightKg: number | null; weekSessionsDone: number }
export interface HomeData { todayTraining: { id: string; name: string; status: string; totalVolumeKg: number } | null; todayDiet: { caloriesKcal: number; proteinG: number; carbsG: number; fatG: number; recordCount: number }; currentWeight: number | null; streak: number; checkIn: CheckInStatus; goals: HomeGoals }
export interface StatsData { totalSessions: number; totalVolumeKg: number; totalSets: number; prCount: number; trainingDaysThisMonth: number; weeklyVolume: { date: string; volume: number }[]; weeklyCalories: { date: string; calories: number }[] }
export interface ExerciseDetails { exercise: ExerciseInfo; pr: { maxWeightKg: number; maxWeightReps: number; achievedAt: string } | null; recentLogs: { id: string; weightKg: number; reps: number; volumeKg: number; isPR: boolean; setOrder: number; sessionName: string; sessionDate: string }[] }

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

  getBodyRecords: (params?: { from?: string; to?: string; limit?: number }) => request<BodyRecord[]>({ url: '/body/records', method: 'GET', data: params }),
  createBodyRecord: (data: BodyRecordInput) => request<BodyRecord>({ url: '/body/records', method: 'POST', data }),
  getBodyLatest: () => request<BodyRecord | null>({ url: '/body/latest' }),
  getBodyTrend: (limit?: number) => request<BodyTrendPoint[]>({ url: '/body/trend', method: 'GET', data: limit ? { limit } : undefined }),

  getExercises: (params?: { category?: string; search?: string }) => request<ExerciseInfo[]>({ url: '/exercises', method: 'GET', data: params }),
  createExercise: (data: ExerciseInput) => request<ExerciseInfo>({ url: '/exercises', method: 'POST', data }),
  updateExercise: (id: string, data: Partial<ExerciseInput>) => request<ExerciseInfo>({ url: '/exercises/' + id, method: 'PUT', data }),
  deleteExercise: (id: string) => request({ url: '/exercises/' + id, method: 'DELETE' }),

  getPlans: () => request<PlanInfo[]>({ url: '/plans' }),
  createPlan: (data: { name: string; note?: string }) => request<PlanInfo>({ url: '/plans', method: 'POST', data }),
  updatePlan: (id: string, data: { name?: string; note?: string }) => request<PlanInfo>({ url: '/plans/' + id, method: 'PUT', data }),
  deletePlan: (id: string) => request({ url: '/plans/' + id, method: 'DELETE' }),
  clonePlan: (id: string) => request<PlanInfo>({ url: '/plans/' + id + '/clone', method: 'POST' }),
  addPlanExercise: (planId: string, data: PlanExerciseInput) => request<PlanExercise>({ url: '/plans/' + planId + '/exercises', method: 'POST', data }),
  updatePlanExercise: (planId: string, itemId: string, data: Partial<PlanExerciseInput>) => request<PlanExercise>({ url: '/plans/' + planId + '/exercises/' + itemId, method: 'PUT', data }),
  removePlanExercise: (planId: string, itemId: string) => request({ url: '/plans/' + planId + '/exercises/' + itemId, method: 'DELETE' }),
  reorderPlanExercises: (planId: string, items: { id: string; sortOrder: number }[]) => request<PlanInfo>({ url: '/plans/' + planId + '/reorder', method: 'PUT', data: { items } }),

  startSession: (data: { planId?: string; name?: string }) => request<StartSessionResult>({ url: '/sessions', method: 'POST', data }),
  getSessions: () => request<SessionListItem[]>({ url: '/sessions' }),
  getSession: (id: string) => request<SessionInfo>({ url: '/sessions/' + id }),
  completeSession: (id: string, data?: { note?: string }) => request<SessionInfo>({ url: '/sessions/' + id, method: 'PUT', data }),
  addSessionLog: (sessionId: string, data: { exerciseId: string; weightKg: number; reps: number; note?: string }) => request<SessionLog>({ url: '/sessions/' + sessionId + '/logs', method: 'POST', data }),
  updateSessionLog: (sessionId: string, logId: string, data: { weightKg?: number; reps?: number; note?: string }) => request<SessionLog>({ url: '/sessions/' + sessionId + '/logs/' + logId, method: 'PUT', data }),
  removeSessionLog: (sessionId: string, logId: string) => request({ url: '/sessions/' + sessionId + '/logs/' + logId, method: 'DELETE' }),
  copySessionLog: (sessionId: string, exerciseId: string) => request<SessionLog>({ url: '/sessions/' + sessionId + '/logs/copy', method: 'POST', data: { exerciseId } }),
  getPRs: () => request<PersonalRecordInfo[]>({ url: '/sessions/prs' }),

  getDietRecords: (date?: string) => request<DietRecord[]>({ url: '/diet', method: 'GET', data: date ? { date } : undefined }),
  createDietRecord: (data: DietRecordInput) => request<DietRecord>({ url: '/diet', method: 'POST', data }),
  updateDietRecord: (id: string, data: Partial<DietRecordInput>) => request<DietRecord>({ url: '/diet/' + id, method: 'PUT', data }),
  deleteDietRecord: (id: string) => request({ url: '/diet/' + id, method: 'DELETE' }),
  getDietSummary: (date?: string) => request<DietSummary>({ url: '/diet/summary', method: 'GET', data: date ? { date } : undefined }),
  checkin: (type: string) => request<CheckInStatus>({ url: '/checkins', method: 'POST', data: { type } }),
  getCheckinToday: () => request<CheckInStatus>({ url: '/checkins/today' }),
  getStreak: () => request<{ streak: number }>({ url: '/checkins/streak' }),
  getHome: () => request<HomeData>({ url: '/home' }),
  getStats: () => request<StatsData>({ url: '/stats' }),
  getExerciseDetails: (id: string) => request<ExerciseDetails>({ url: '/exercises/' + id + '/details' }),
}