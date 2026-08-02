<template>
  <view class='page'>
    <view class='title'>训练计划</view>
    <view class='card btn-row'>
      <button class='btn-add' @click='onAdd'>+ 创建训练日</button>
      <button class='btn-tpl' @click='showTpl = true'>使用模板</button>
    </view>

    <view v-if='showForm' class='overlay'>
      <view class='form-card'>
        <view class='form-title'>{{ editing ? '编辑训练日' : '创建训练日' }}</view>
        <view class='row'><text class='label'>名称</text><input class='input' v-model='form.name' placeholder='如 推日/拉日/腿日' /></view>
        <view class='row'><text class='label'>备注</text><input class='input' v-model='form.note' placeholder='可选' /></view>
        <view class='form-btns'>
          <button @click='showForm = false'>取消</button>
          <button class='btn-primary' @click='onSave'>保存</button>
        </view>
      </view>
    </view>

    <view v-if='showTpl' class='overlay'>
      <view class='form-card'>
        <view class='form-title'>选择模板</view>
        <view v-for='t in templates' :key='t.name' class='tpl-item' @click='onApplyTpl(t)'>
          <view>
            <text class='tpl-name'>{{ t.name }}</text>
            <text class='tpl-note'>{{ t.note }}</text>
          </view>
          <text class='tpl-count'>{{ t.exercises.length }}个动作</text>
        </view>
        <button @click='showTpl = false'>取消</button>
      </view>
    </view>

    <view v-for='p in plans' :key='p.id' class='card item' @click='goDetail(p.id)'>
      <view class='item-main'>
        <text class='item-name'>{{ p.name }}</text>
        <text class='count'>{{ p.exercises.length }} 个动作</text>
      </view>
      <text v-if='p.note' class='muted'>{{ p.note }}</text>
      <view class='item-actions' @click.stop=''>
        <button size='mini' @click='onEdit(p)'>编辑</button>
        <button size='mini' class='btn-warn' @click='onDelete(p)'>删除</button>
      </view>
    </view>
    <view v-if='plans.length === 0' class='muted center'>暂无训练日，点击上方创建或使用模板</view>
  </view>
</template>

<script setup lang='ts'>
import { ref, reactive, onMounted } from 'vue'
import { api, type PlanInfo, type ExerciseInfo } from '../../api'

interface TplExercise { name: string; sets: number; reps: string; weightKg?: number }
interface PlanTemplate { name: string; note: string; exercises: TplExercise[] }

const templates: PlanTemplate[] = [
  {
    name: '推日', note: '胸+肩+三头',
    exercises: [
      { name: '杠铃卧推', sets: 4, reps: '6-8' },
      { name: '上斜哑铃卧推', sets: 3, reps: '8-10' },
      { name: '哑铃推举', sets: 3, reps: '8-10' },
      { name: '哑铃侧平举', sets: 3, reps: '12-15' },
      { name: '绳索下压', sets: 3, reps: '10-12' },
    ],
  },
  {
    name: '拉日', note: '背+二头',
    exercises: [
      { name: '引体向上', sets: 4, reps: '6-10' },
      { name: '高位下拉', sets: 3, reps: '8-12' },
      { name: '杠铃划船', sets: 3, reps: '8-10' },
      { name: '坐姿绳索划船', sets: 3, reps: '10-12' },
      { name: '杠铃弯举', sets: 3, reps: '10-12' },
    ],
  },
  {
    name: '腿日', note: '腿+核心',
    exercises: [
      { name: '杠铃深蹲', sets: 5, reps: '5' },
      { name: '腿举', sets: 3, reps: '10-12' },
      { name: '罗马尼亚硬拉', sets: 3, reps: '8-10' },
      { name: '坐姿腿弯举', sets: 3, reps: '12-15' },
      { name: '平板支撑', sets: 3, reps: '30-60' },
    ],
  },
  {
    name: '全身训练', note: '每部位一个动作',
    exercises: [
      { name: '杠铃深蹲', sets: 4, reps: '6-8' },
      { name: '杠铃卧推', sets: 4, reps: '6-8' },
      { name: '引体向上', sets: 3, reps: '8-10' },
      { name: '哑铃推举', sets: 3, reps: '8-10' },
      { name: '杠铃弯举', sets: 3, reps: '10-12' },
      { name: '卷腹', sets: 3, reps: '15-20' },
    ],
  },
]

const plans = ref<PlanInfo[]>([])
const showForm = ref(false)
const showTpl = ref(false)
const editing = ref<PlanInfo | null>(null)
const form = reactive({ name: '', note: '' })

onMounted(load)

async function load() { try { plans.value = await api.getPlans() } catch {} }
function goDetail(id: string) { uni.navigateTo({ url: '/pages/plan-detail/plan-detail?id=' + id }) }
function onAdd() { editing.value = null; form.name = ''; form.note = ''; showForm.value = true }
function onEdit(p: PlanInfo) { editing.value = p; form.name = p.name; form.note = p.note || ''; showForm.value = true }

async function onSave() {
  if (!form.name.trim()) { uni.showToast({ title: '名称不能为空', icon: 'none' }); return }
  try {
    if (editing.value) { await api.updatePlan(editing.value.id, { name: form.name, note: form.note || undefined }) }
    else { await api.createPlan({ name: form.name, note: form.note || undefined }) }
    showForm.value = false
    uni.showToast({ title: '已保存', icon: 'success' })
    await load()
  } catch {}
}

async function onApplyTpl(tpl: PlanTemplate) {
  uni.showLoading({ title: '创建中...' })
  try {
    const plan = await api.createPlan({ name: tpl.name, note: tpl.note })
    const exercises = await api.getExercises()
    for (const ex of tpl.exercises) {
      const found = exercises.find(e => e.name === ex.name)
      if (found) {
        await api.addPlanExercise(plan.id, { exerciseId: found.id, sets: ex.sets, reps: ex.reps, weightKg: ex.weightKg })
      }
    }
    uni.hideLoading()
    showTpl.value = false
    uni.showToast({ title: '模板已应用', icon: 'success' })
    await load()
  } catch { uni.hideLoading() }
}

async function onDelete(p: PlanInfo) {
  uni.showModal({ title: '确认删除', content: '删除 ' + p.name + ' ?', success: async (r) => { if (!r.confirm) return; try { await api.deletePlan(p.id); uni.showToast({ title: '已删除', icon: 'success' }); await load() } catch {} } })
}
</script>

<style>
.page { padding: 24rpx; }
.title { font-size: 36rpx; font-weight: bold; margin-bottom: 24rpx; text-align: center; }
.card { background: #fff; border-radius: 16rpx; padding: 24rpx; margin-bottom: 16rpx; }
.btn-row { display: flex; gap: 16rpx; }
.btn-add { background: #34c759; color: #fff; flex: 1; }
.btn-tpl { background: #ff9500; color: #fff; flex: 1; }
.overlay { position: fixed; top: 0; left: 0; right: 0; bottom: 0; background: rgba(0,0,0,0.5); z-index: 999; display: flex; align-items: center; justify-content: center; }
.form-card { background: #fff; border-radius: 16rpx; padding: 32rpx; width: 86%; }
.form-title { font-size: 32rpx; font-weight: bold; margin-bottom: 24rpx; text-align: center; }
.row { display: flex; align-items: center; margin-bottom: 24rpx; }
.label { width: 120rpx; color: #666; }
.input { flex: 1; border: 1rpx solid #ddd; border-radius: 8rpx; padding: 12rpx; }
.form-btns { display: flex; gap: 16rpx; }
.form-btns button { flex: 1; }
.btn-primary { background: #007aff; color: #fff; }
.tpl-item { display: flex; align-items: center; justify-content: space-between; padding: 20rpx 0; border-bottom: 1rpx solid #f0f0f0; }
.tpl-name { font-size: 32rpx; font-weight: bold; }
.tpl-note { display: block; color: #999; font-size: 24rpx; margin-top: 4rpx; }
.tpl-count { color: #007aff; font-size: 26rpx; }
.item-main { display: flex; align-items: center; justify-content: space-between; }
.item-name { font-size: 32rpx; font-weight: bold; }
.count { color: #007aff; font-size: 26rpx; }
.muted { color: #999; font-size: 26rpx; display: block; margin-top: 8rpx; }
.center { text-align: center; padding: 48rpx; }
.item-actions { display: flex; gap: 12rpx; margin-top: 16rpx; }
.item-actions button { flex: 1; }
.btn-warn { background: #ff3b30; color: #fff; }
</style>