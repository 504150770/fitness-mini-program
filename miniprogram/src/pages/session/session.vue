<template>
  <view class='page'>
    <view class='card'>
      <view class='session-head'>
        <text class='session-name'>{{ session?.name || '加载中...' }}</text>
        <text class='status-badge' :class='session?.status === "ACTIVE" ? "badge-active" : "badge-done"'>{{ session?.status === "ACTIVE" ? "进行中" : "已完成" }}</text>
      </view>
      <view v-if='session' class='stats'>
        <view class='stat'><text class='stat-val'>{{ totalVolume }}</text><text class='stat-label'>总容量kg</text></view>
        <view class='stat'><text class='stat-val'>{{ exerciseGroups.length }}</text><text class='stat-label'>动作数</text></view>
        <view class='stat'><text class='stat-val'>{{ session.logs.length }}</text><text class='stat-label'>总组数</text></view>
      </view>
    </view>

    <view v-if='plannedExercises.length > 0 && session?.status === "ACTIVE"' class='card'>
      <view class='section-title'>计划动作</view>
      <view v-for='pe in plannedExercises' :key='pe.exerciseId' class='plan-ex'>
        <text class='plan-ex-name'>{{ pe.exerciseName }}</text>
        <text class='muted'>{{ pe.sets }}组 x {{ pe.reps }}{{ pe.weightKg ? " / " + pe.weightKg + "kg" : "" }}</text>
        <button v-if='!hasLogsFor(pe.exerciseId)' size='mini' @click='quickAdd(pe)'>开始</button>
      </view>
    </view>

    <view v-for='g in exerciseGroups' :key='g.exerciseId' class='card'>
      <view class='ex-head'>
        <text class='ex-name'>{{ g.exerciseName }}</text>
        <text class='muted'>{{ g.logs.length }}组</text>
      </view>
      <view v-for='log in g.logs' :key='log.id' class='log-row'>
        <text class='log-set'>第{{ log.setOrder }}组</text>
        <text class='log-data'>{{ log.weightKg }}kg x {{ log.reps }}</text>
        <text class='log-vol'>{{ log.volumeKg }}kg</text>
        <text v-if='log.isPR' class='pr-badge'>PR</text>
        <button v-if='session?.status === "ACTIVE"' size='mini' class='btn-warn' @click='onDelLog(log)'>删</button>
      </view>
      <view v-if='session?.status === "ACTIVE"' class='add-form'>
        <input class='form-input' type='digit' v-model='forms[g.exerciseId].weight' placeholder='重量' />
        <text class='x'>x</text>
        <input class='form-input' type='number' v-model='forms[g.exerciseId].reps' placeholder='次数' />
        <button size='mini' @click='onCopy(g.exerciseId)'>复制</button>
        <button size='mini' class='btn-primary' @click='onAddLog(g.exerciseId)'>记录</button>
      </view>
    </view>

    <view v-if='session?.status === "ACTIVE"' class='card'>
      <button class='btn-add' @click='showPicker = true'>+ 添加动作</button>
      <button class='btn-complete' @click='onComplete'>完成训练</button>
    </view>

    <view v-if='showPicker' class='overlay'>
      <view class='picker-card'>
        <view class='picker-head'>
          <text class='picker-title'>选择动作</text>
          <text class='picker-close' @click='showPicker = false'>关闭</text>
        </view>
        <input class='search' v-model='pickSearch' placeholder='搜索' @input='onPickSearch' />
        <scroll-view scroll-y class='pick-list'>
          <view v-for='e in pickList' :key='e.id' class='pick-item' @click='onPick(e)'>
            <text>{{ e.name }}</text><text class='muted'>{{ catLabel(e.category) }}</text>
          </view>
        </scroll-view>
      </view>
    </view>
  </view>
</template>

<script setup lang='ts'>
import { ref, reactive, computed, onMounted } from 'vue'
import { api, type SessionInfo, type SessionLog, type ExerciseInfo, type PlannedExercise, EXERCISE_CATEGORIES } from '../../api'
import { getPendingExercises, clearPendingExercises } from '../../api/state'

const sessionId = ref('')
const session = ref<SessionInfo | null>(null)
const plannedExercises = ref<PlannedExercise[]>([])
const forms = reactive<Record<string, { weight: string; reps: string }>>({})
const showPicker = ref(false)
const pickList = ref<ExerciseInfo[]>([])
const pickSearch = ref('')
let pickTimer: any = null

const totalVolume = computed(() => session.value ? session.value.totalVolumeKg.toFixed(1) : '0')

const exerciseGroups = computed(() => {
  if (!session.value) return []
  const map: Record<string, { exerciseId: string; exerciseName: string; logs: SessionLog[] }> = {}
  for (const log of session.value.logs) {
    if (!map[log.exerciseId]) map[log.exerciseId] = { exerciseId: log.exerciseId, exerciseName: log.exerciseName, logs: [] }
    map[log.exerciseId].logs.push(log)
  }
  return Object.values(map)
})

onMounted(() => {
  const pages = getCurrentPages()
  const cur = pages[pages.length - 1] as any
  sessionId.value = cur?.options?.id || ''
  plannedExercises.value = getPendingExercises()
  clearPendingExercises()
  loadSession()
})

function catLabel(v: string) { return EXERCISE_CATEGORIES.find(c => c.value === v)?.label || v }
function hasLogsFor(exerciseId: string) { return session.value?.logs.some(l => l.exerciseId === exerciseId) }

async function loadSession() {
  try {
    session.value = await api.getSession(sessionId.value)
    for (const g of exerciseGroups.value) {
      if (!forms[g.exerciseId]) forms[g.exerciseId] = { weight: '', reps: '' }
    }
  } catch {}
}

function quickAdd(pe: PlannedExercise) {
  forms[pe.exerciseId] = { weight: pe.weightKg ? String(pe.weightKg) : '', reps: '' }
  if (!exerciseGroups.value.find(g => g.exerciseId === pe.exerciseId)) {
    session.value?.logs.push({ id: '_tmp', exerciseId: pe.exerciseId, exerciseName: pe.exerciseName, setOrder: 0, weightKg: 0, reps: 0, volumeKg: 0, isPR: false, note: null })
  }
}

async function onAddLog(exerciseId: string) {
  const f = forms[exerciseId]
  if (!f || !f.weight || !f.reps) { uni.showToast({ title: '请输入重量和次数', icon: 'none' }); return }
  try {
    await api.addSessionLog(sessionId.value, { exerciseId, weightKg: Number(f.weight), reps: Number(f.reps) })
    f.weight = ''; f.reps = ''
    uni.showToast({ title: '已记录', icon: 'success' })
    await loadSession()
  } catch {}
}

async function onCopy(exerciseId: string) {
  try { await api.copySessionLog(sessionId.value, exerciseId); uni.showToast({ title: '已复制', icon: 'success' }); await loadSession() } catch {}
}

async function onDelLog(log: SessionLog) {
  uni.showModal({ title: '确认', content: '删除第' + log.setOrder + '组?', success: async (r) => { if (!r.confirm) return; try { await api.removeSessionLog(sessionId.value, log.id); await loadSession() } catch {} } })
}

async function onComplete() {
  uni.showModal({ title: '完成训练', content: '确定结束本次训练?', success: async (r) => { if (!r.confirm) return; try { await api.completeSession(sessionId.value); uni.showToast({ title: '训练完成', icon: 'success' }); setTimeout(() => uni.navigateBack(), 1500) } catch {} } })
}

function onPickSearch() { clearTimeout(pickTimer); pickTimer = setTimeout(loadPickList, 300) }
async function loadPickList() { try { pickList.value = await api.getExercises({ search: pickSearch.value || undefined }) } catch {} }
async function onPick(e: ExerciseInfo) {
  if (!forms[e.id]) forms[e.id] = { weight: '', reps: '' }
  session.value?.logs.push({ id: '_new_' + e.id, exerciseId: e.id, exerciseName: e.name, setOrder: 0, weightKg: 0, reps: 0, volumeKg: 0, isPR: false, note: null })
  showPicker.value = false
}
</script>

<style>
.page { padding: 24rpx; }
.card { background: #fff; border-radius: 16rpx; padding: 24rpx; margin-bottom: 16rpx; }
.session-head { display: flex; align-items: center; justify-content: space-between; }
.session-name { font-size: 36rpx; font-weight: bold; }
.status-badge { font-size: 24rpx; padding: 4rpx 16rpx; border-radius: 8rpx; }
.badge-active { background: #34c759; color: #fff; }
.badge-done { background: #e0e0e0; color: #666; }
.stats { display: flex; justify-content: space-around; margin-top: 16rpx; }
.stat { text-align: center; }
.stat-val { font-size: 40rpx; font-weight: bold; display: block; }
.stat-label { font-size: 24rpx; color: #999; }
.section-title { font-size: 30rpx; font-weight: bold; margin-bottom: 16rpx; }
.plan-ex { display: flex; align-items: center; gap: 16rpx; padding: 12rpx 0; border-bottom: 1rpx solid #f0f0f0; }
.plan-ex-name { font-size: 30rpx; flex: 1; }
.muted { color: #999; font-size: 26rpx; }
.ex-head { display: flex; align-items: center; justify-content: space-between; margin-bottom: 12rpx; }
.ex-name { font-size: 32rpx; font-weight: bold; }
.log-row { display: flex; align-items: center; gap: 12rpx; padding: 12rpx 0; border-bottom: 1rpx solid #f5f5f5; }
.log-set { width: 100rpx; color: #666; font-size: 26rpx; }
.log-data { flex: 1; font-weight: bold; }
.log-vol { color: #007aff; font-size: 26rpx; }
.pr-badge { background: #ff9500; color: #fff; font-size: 20rpx; padding: 2rpx 8rpx; border-radius: 4rpx; }
.add-form { display: flex; align-items: center; gap: 8rpx; margin-top: 16rpx; }
.form-input { flex: 1; border: 1rpx solid #ddd; border-radius: 8rpx; padding: 8rpx; text-align: center; }
.x { color: #999; }
.btn-primary { background: #007aff; color: #fff; }
.btn-warn { background: #ff3b30; color: #fff; }
.btn-add { background: #34c759; color: #fff; margin-bottom: 12rpx; }
.btn-complete { background: #007aff; color: #fff; }
.overlay { position: fixed; top: 0; left: 0; right: 0; bottom: 0; background: rgba(0,0,0,0.5); z-index: 999; display: flex; align-items: flex-end; }
.picker-card { background: #fff; border-radius: 16rpx 16rpx 0 0; padding: 24rpx; width: 100%; max-height: 70vh; display: flex; flex-direction: column; }
.picker-head { display: flex; justify-content: space-between; align-items: center; margin-bottom: 16rpx; }
.picker-title { font-size: 32rpx; font-weight: bold; }
.picker-close { color: #007aff; }
.search { border: 1rpx solid #ddd; border-radius: 8rpx; padding: 12rpx; margin-bottom: 12rpx; }
.pick-list { flex: 1; max-height: 500rpx; }
.pick-item { display: flex; justify-content: space-between; padding: 20rpx 0; border-bottom: 1rpx solid #f0f0f0; }
</style>