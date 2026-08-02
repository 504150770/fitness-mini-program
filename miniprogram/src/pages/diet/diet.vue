<template>
  <view class='page'>
    <view class='title'>饮食记录</view>

    <view class='card'>
      <view class='date-row'>
        <text class='date-label'>日期</text>
        <picker mode='date' :value='date' @change='onDate'>
          <text class='date-val'>{{ date }}</text>
        </picker>
      </view>
      <view class='totals'>
        <view class='total'><text class='t-val'>{{ summary.caloriesKcal }}</text><text class='t-label'>热量kcal</text></view>
        <view class='total'><text class='t-val'>{{ summary.proteinG }}</text><text class='t-label'>蛋白质g</text></view>
        <view class='total'><text class='t-val'>{{ summary.carbsG }}</text><text class='t-label'>碳水g</text></view>
        <view class='total'><text class='t-val'>{{ summary.fatG }}</text><text class='t-label'>脂肪g</text></view>
      </view>
    </view>

    <view v-for='mt in mealTypes' :key='mt.value' class='card'>
      <view class='meal-head'>
        <text class='meal-name'>{{ mt.label }}</text>
        <button size='mini' class='btn-add-sm' @click='onAdd(mt.value)'>+ 添加</button>
      </view>
      <view v-for='r in recordsByMeal[mt.value] || []' :key='r.id' class='food-item'>
        <view class='food-main'>
          <text class='food-name'>{{ r.foodName }}</text>
          <text class='food-cal'>{{ r.caloriesKcal }}kcal</text>
        </view>
        <view class='food-sub'>
          <text v-if='r.proteinG != null' class='muted'>蛋白{{ r.proteinG }}g</text>
          <text v-if='r.carbsG != null' class='muted'>碳水{{ r.carbsG }}g</text>
          <text v-if='r.fatG != null' class='muted'>脂肪{{ r.fatG }}g</text>
        </view>
        <button size='mini' class='btn-warn' @click='onDelete(r)'>删</button>
      </view>
    </view>

    <view v-if='showForm' class='overlay'>
      <view class='form-card'>
        <view class='form-title'>添加{{ mealLabel(form.mealType) }}</view>
        <view class='row'><text class='label'>食物</text><input class='input' v-model='form.foodName' placeholder='食物名称' /></view>
        <view class='row'><text class='label'>热量</text><input class='input' type='number' v-model='form.caloriesKcal' placeholder='kcal' /></view>
        <view class='row3'>
          <view><text class='label'>蛋白g</text><input class='input' type='digit' v-model='form.proteinG' placeholder='可选' /></view>
          <view><text class='label'>碳水g</text><input class='input' type='digit' v-model='form.carbsG' placeholder='可选' /></view>
          <view><text class='label'>脂肪g</text><input class='input' type='digit' v-model='form.fatG' placeholder='可选' /></view>
        </view>
        <view class='form-btns'>
          <button @click='showForm = false'>取消</button>
          <button class='btn-primary' @click='onSave'>保存</button>
        </view>
      </view>
    </view>
  </view>
</template>

<script setup lang='ts'>
import { ref, reactive, computed, onMounted } from 'vue'
import { api, type DietRecord, type DietSummary } from '../../api'

const mealTypes = [
  { value: 'BREAKFAST', label: '早餐' },
  { value: 'LUNCH', label: '午餐' },
  { value: 'DINNER', label: '晚餐' },
  { value: 'SNACK', label: '加餐' },
]

const date = ref(new Date().toISOString().slice(0, 10))
const records = ref<DietRecord[]>([])
const summary = ref<DietSummary>({ records: [], caloriesKcal: 0, proteinG: 0, carbsG: 0, fatG: 0, recordCount: 0 })
const showForm = ref(false)
const form = reactive({ mealType: 'BREAKFAST', foodName: '', caloriesKcal: '', proteinG: '', carbsG: '', fatG: '' })

const recordsByMeal = computed(() => {
  const map: Record<string, DietRecord[]> = {}
  for (const r of records.value) {
    if (!map[r.mealType]) map[r.mealType] = []
    map[r.mealType].push(r)
  }
  return map
})

onMounted(load)

async function load() {
  try {
    const s = await api.getDietSummary(date.value)
    summary.value = s
    records.value = s.records
  } catch {}
}

function onDate(e: any) { date.value = e.detail.value; load() }
function mealLabel(v: string) { return mealTypes.find(m => m.value === v)?.label || v }
function onAdd(mealType: string) { form.mealType = mealType; form.foodName = ''; form.caloriesKcal = ''; form.proteinG = ''; form.carbsG = ''; form.fatG = ''; showForm.value = true }

async function onSave() {
  if (!form.foodName.trim() || !form.caloriesKcal) { uni.showToast({ title: '请填写食物和热量', icon: 'none' }); return }
  try {
    await api.createDietRecord({
      mealType: form.mealType, foodName: form.foodName, caloriesKcal: Number(form.caloriesKcal),
      proteinG: form.proteinG ? Number(form.proteinG) : undefined,
      carbsG: form.carbsG ? Number(form.carbsG) : undefined,
      fatG: form.fatG ? Number(form.fatG) : undefined,
    })
    showForm.value = false
    uni.showToast({ title: '已记录', icon: 'success' })
    await load()
  } catch {}
}

async function onDelete(r: DietRecord) {
  uni.showModal({ title: '确认', content: '删除 ' + r.foodName + '?', success: async (res) => { if (!res.confirm) return; try { await api.deleteDietRecord(r.id); await load() } catch {} } })
}
</script>

<style>
.page { padding: 24rpx; }
.title { font-size: 36rpx; font-weight: bold; margin-bottom: 24rpx; text-align: center; }
.card { background: #fff; border-radius: 16rpx; padding: 24rpx; margin-bottom: 16rpx; }
.date-row { display: flex; align-items: center; gap: 16rpx; margin-bottom: 16rpx; }
.date-label { color: #666; font-size: 28rpx; }
.date-val { color: #007aff; font-size: 28rpx; }
.totals { display: flex; justify-content: space-around; }
.total { text-align: center; }
.t-val { font-size: 36rpx; font-weight: bold; display: block; }
.t-label { font-size: 22rpx; color: #999; }
.meal-head { display: flex; align-items: center; justify-content: space-between; margin-bottom: 12rpx; }
.meal-name { font-size: 30rpx; font-weight: bold; }
.btn-add-sm { background: #34c759; color: #fff; font-size: 24rpx; }
.food-item { display: flex; align-items: center; gap: 12rpx; padding: 12rpx 0; border-bottom: 1rpx solid #f5f5f5; }
.food-main { flex: 1; }
.food-name { font-size: 28rpx; }
.food-cal { color: #007aff; font-size: 26rpx; margin-left: 8rpx; }
.food-sub { display: flex; gap: 8rpx; }
.muted { color: #999; font-size: 22rpx; }
.btn-warn { background: #ff3b30; color: #fff; }
.overlay { position: fixed; top: 0; left: 0; right: 0; bottom: 0; background: rgba(0,0,0,0.5); z-index: 999; display: flex; align-items: center; justify-content: center; }
.form-card { background: #fff; border-radius: 16rpx; padding: 32rpx; width: 86%; }
.form-title { font-size: 32rpx; font-weight: bold; margin-bottom: 24rpx; text-align: center; }
.row { display: flex; align-items: center; margin-bottom: 24rpx; }
.label { width: 100rpx; color: #666; font-size: 26rpx; }
.input { flex: 1; border: 1rpx solid #ddd; border-radius: 8rpx; padding: 12rpx; }
.row3 { display: flex; gap: 16rpx; margin-bottom: 24rpx; }
.row3 view { flex: 1; }
.row3 .label { width: auto; display: block; margin-bottom: 4rpx; }
.form-btns { display: flex; gap: 16rpx; }
.form-btns button { flex: 1; }
.btn-primary { background: #007aff; color: #fff; }
</style>