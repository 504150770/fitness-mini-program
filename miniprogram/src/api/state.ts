let pendingPlannedExercises: { exerciseId: string; exerciseName: string; category: string; sets: number; reps: string; weightKg: number | null }[] = []
export function setPendingExercises(list: typeof pendingPlannedExercises) { pendingPlannedExercises = list }
export function getPendingExercises() { return pendingPlannedExercises }
export function clearPendingExercises() { pendingPlannedExercises = [] }