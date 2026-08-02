<template>
  <view class='page'>
    <view class='card'>
      <view class='plan-name'>{{ plan?.name || '加载中...' }}</view>
      <text v-if='plan?.note' class='muted'>{{ plan.note }}</text>
    </view>

    <view class='card'>
      <button class='btn-start' @click='onStart'>开始训练</button>
    </view>

    <view class='card'>
      <button class='btn-add' @click='onShowPicker'>+ 添加动作</button>
    </view>

    <view v-for='(ex, i) in plan?.exercises' :key='ex.id' class='card ex-item'>
      <view class='ex-head'>
        <text class='ex-name'>{{ ex.exerciseName }}</text>
        <text class='cat-badge'>{{ catLabel(ex.category) }}</text>
      </view>
      <view class='ex-form'>
        <view class='field'>
          <text class='field-label'>组数</text>
          <input class='field-input' type='number' v-model='forms[ex.id].sets' />
        </view>
        <view class='field'>
          <text class='field-label'>次数</text>
          <input class='field-input' v-model='forms[ex.id].reps' />
        </view>
        <view class='field'>
          <text class='field-label'>重量kg</text>
          <input class='field-input' type='digit' v-model='forms[ex.id].weightKg' placeholder='可选' />
        </view>
      </view>
      <view class='field-row'>
        <text class='field-label'>备注</text>
        <input class='field-input full' v-model='forms[ex.id].note' placeholder='可选' />
      </view>
      <view class='ex-actions'>
        <button size='mini' :disabled='i === 0' @click='onMove(i, -1)'>上移</button>
        <button size='mini' :disabled='i === (plan?.exercises.length || 0) - 1' @click='onMove(i, 1)'>下移</button>
        <button size='mini' @click='onSaveEx(ex)'>保存</button>
        <button size='mini' class='btn-warn' @click='onDelEx(ex)'>删除</button>
      </view>
    </view>

    <view v-if='plan && plan.exercises.length === 0' class='muted center'>暂无动作，点击上方添加</view>

    <view v-if='showPicker' class='overlay'>
      <view class='picker-card'>
        <view class='picker-head'>
          <text class='picker-title'>选择动作</text>
          <text class='picker-close' @click='showPicker = false'>关闭</text>
        </view>
        <input class='search' v-model='pickSearch' placeholder='搜索' @input='onPickSearch' />
        <scroll-view scroll-x class='tabs'>
          <text v-for='c in pickCats' :key='c.value' class='tab' :class='{ active: pickCat === c.value }' @click='pickCat = c.value; loadPickList()'>{{ c.label }}</text>
        </scroll-view>
        <scroll-view scroll-y class='pick-list'>
          <view v-for='e in pickList' :key='e.id' class='pick-item' @click='onPick(e)'>
            <text>{{ e.name }}</text>
            <text class='muted'>{{ catLabel(e.category) }}</text>
          </view>
        </scroll-view>
      </view>
    </view>
  </view>
</template>

<script setup lang='ts'>
import { ref, reactive, onMounted } from 'vue'
import { api, type PlanInfo, type PlanExercise, type ExerciseInfo, EXERCISE_CATEGORIES } from '../../api'
import { setPendingExercises } from '../../api/state'

const planId = ref('')
const plan = ref<PlanInfo | null>(null)
const forms = reactive<Record<string, { sets: string; reps: string; weightKg: string; note: string }>>({})

const showPicker = ref(false)
const pickList = ref<ExerciseInfo[]>([])
const pickSearch = ref('')
const pickCat = ref('')
let pickTimer: any = null
const pickCats = [{ value: '', label: '全部' }, ...EXERCISE_CATEGORIES]

onMounted(() => {
  const pages = getCurrentPages()
  const cur = pages[pages.length - 1] as any
  planId.value = cur?.options?.id || ''
  loadPlan()
})

function catLabel(v: string) { return EXERCISE_CATEGORIES.find(c => c.value === v)?.label || v }

async function loadPlan() {
  try {
    const plans = await api.getPlans()
    plan.value = plans.find(p => p.id === planId.value) || null
    syncForms()
  } catch {}
}

function syncForms() {
  if (!plan.value) return
  for (const ex of plan.value.exercises) {
    forms[ex.id] = {
      sets: String(ex.sets),
      reps: ex.reps,
      weightKg: ex.weightKg != null ? String(ex.weightKg) : '',
      note: ex.note || '',
    }
  }
}

async function onSaveEx(ex: PlanExercise) {
  const f = forms[ex.id]
  try {
    await api.updatePlanExercise(planId.value, ex.id, {
      sets: Number(f.sets) || undefined,
      reps: f.reps || undefined,
      weightKg: f.weightKg ? Number(f.weightKg) : undefined,
      note: f.note || undefined,
    })
    uni.showToast({ title: '已保存', icon: 'success' })
    await loadPlan()
  } catch {}
}

async function onMove(idx: number, dir: number) {
  if (!plan.value) return
  const arr = plan.value.exercises
  const ni = idx + dir
  if (ni < 0 || ni >= arr.length) return
  const items = arr.map((e, i) => ({ id: e.id, sortOrder: i === idx ? ni : i === ni ? idx : i }))
  try {
    plan.value = await api.reorderPlanExercises(planId.value, items)
    syncForms()
  } catch {}
}

async function onDelEx(ex: PlanExercise) {
  uni.showModal({
    title: '确认', content: '移除 ' + ex.exerciseName + ' ?',
    success: async (r) => { if (!r.confirm) return; try { await api.removePlanExercise(planId.value, ex.id); await loadPlan() } catch {} },
  })
}

async function onStart() {
  try {
    const result = await api.startSession({ planId: planId.value })
    setPendingExercises(result.plannedExercises)
    uni.navigateTo({ url: '/pages/session/session?id=' + result.session.id })
  } catch {}
}

function onShowPicker() { showPicker.value = true; pickSearch.value = ''; pickCat.value = ''; loadPickList() }
function onPickSearch() { clearTimeout(pickTimer); pickTimer = setTimeout(loadPickList, 300) }

async function loadPickList() {
  try {
    pickList.value = await api.getExercises({ category: pickCat.value || undefined, search: pickSearch.value || undefined })
  } catch {}
}

async function onPick(e: ExerciseInfo) {
  try {
    await api.addPlanExercise(planId.value, { exerciseId: e.id })
    showPicker.value = false
    uni.showToast({ title: '已添加', icon: 'success' })
    await loadPlan()
  } catch {}
}
</script>

<style>
.page { padding: 24rpx; }
.card { background: #fff; border-radius: 16rpx; padding: 24rpx; margin-bottom: 16rpx; }
.plan-name { font-size: 36rpx; font-weight: bold; }
.muted { color: #999; font-size: 26rpx; }
.center { text-align: center; padding: 48rpx; }
.btn-start { background: #ff9500; color: #fff; margin-bottom: 12rpx; }
.btn-add { background: #34c759; color: #fff; }
.ex-item { }
.ex-head { display: flex; align-items: center; gap: 16rpx; margin-bottom: 16rpx; }
.ex-name { font-size: 32rpx; font-weight: bold; }
.cat-badge { background: #f0f0f0; border-radius: 6rpx; padding: 4rpx 12rpx; font-size: 24rpx; color: #333; }
.ex-form { display: flex; gap: 16rpx; margin-bottom: 16rpx; }
.field { flex: 1; }
.field-label { font-size: 24rpx; color: #999; display: block; }
.field-input { border: 1rpx solid #ddd; border-radius: 8rpx; padding: 8rpx; margin-top: 4rpx; }
.field-input.full { width: 100%; box-sizing: border-box; }
.field-row { display: flex; align-items: center; gap: 16rpx; margin-bottom: 16rpx; }
.field-row .field-label { width: 80rpx; }
.field-row .field-input { flex: 1; }
.ex-actions { display: flex; gap: 8rpx; }
.ex-actions button { flex: 1; font-size: 24rpx; }
.overlay { position: fixed; top: 0; left: 0; right: 0; bottom: 0; background: rgba(0,0,0,0.5); z-index: 999; display: flex; align-items: flex-end; }
.picker-card { background: #fff; border-radius: 16rpx 16rpx 0 0; padding: 24rpx; width: 100%; max-height: 80vh; display: flex; flex-direction: column; }
.picker-head { display: flex; justify-content: space-between; align-items: center; margin-bottom: 16rpx; }
.picker-title { font-size: 32rpx; font-weight: bold; }
.picker-close { color: #007aff; }
.search { border: 1rpx solid #ddd; border-radius: 8rpx; padding: 12rpx; margin-bottom: 12rpx; }
.tabs { white-space: nowrap; margin-bottom: 12rpx; }
.tab { display: inline-block; padding: 8rpx 20rpx; margin-right: 8rpx; border-radius: 8rpx; background: #f0f0f0; font-size: 26rpx; color: #666; }
.tab.active { background: #007aff; color: #fff; }
.pick-list { flex: 1; max-height: 600rpx; }
.pick-item { display: flex; justify-content: space-between; padding: 20rpx 0; border-bottom: 1rpx solid #f0f0f0; }
.btn-warn { background: #ff3b30; color: #fff; }
</style>