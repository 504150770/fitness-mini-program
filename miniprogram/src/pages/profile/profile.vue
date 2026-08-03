<template>
  <view class='page'>
    <view class='title'>用户资料</view>
    <view class='card'>
      <view class='section-title'>基本信息</view>
      <view class='row'>
        <text class='label'>性别</text>
        <picker mode='selector' :range='genderLabels' :value='genderIndex' @change='onGender' class='picker'>
          <text>{{ hasGender ? genderLabels[genderIndex] : '请选择' }}</text>
        </picker>
      </view>
      <view class='row'>
        <text class='label'>出生日期</text>
        <picker mode='date' :value='form.birthDate' @change='onBirth' class='picker'>
          <text>{{ form.birthDate || '请选择' }}</text>
        </picker>
      </view>
      <view class='row'>
        <text class='label'>身高(cm)</text>
        <input class='input' type='digit' v-model='form.heightCm' placeholder='如 175' />
      </view>
      <view class='row'>
        <text class='label'>健身目标</text>
        <input class='input' v-model='form.goal' placeholder='如 增肌减脂' />
      </view>
      <view v-if='profile' class='muted'>当前年龄: {{ profile.age == null ? '-' : profile.age }} 岁</view>
    </view>

    <view class='card'>
      <view class='section-title'>每日目标</view>
      <view class='row'>
        <text class='label'>热量目标</text>
        <input class='input' type='digit' v-model='form.dailyCalorieGoal' placeholder='kcal 如 2000' />
      </view>
      <view class='row'>
        <text class='label'>蛋白质目标</text>
        <input class='input' type='digit' v-model='form.dailyProteinGoal' placeholder='g 如 150' />
      </view>
      <view class='row'>
        <text class='label'>每周训练</text>
        <input class='input' type='digit' v-model='form.weeklyTrainGoal' placeholder='次 如 4' />
      </view>
      <view class='row'>
        <text class='label'>目标体重</text>
        <input class='input' type='digit' v-model='form.targetWeightKg' placeholder='kg 如 70' />
      </view>
    </view>

    <button class='btn-primary' @click='onSave'>保存资料</button>

    <view class='card'>
      <view class='section-title'>更多功能</view>
      <view class='nav-list'>
        <view class='nav-item' @click='go(body)'><text>身体数据</text><text class='nav-arrow'>></text></view>
        <view class='nav-item' @click='go(exercise)'><text>动作库</text><text class='nav-arrow'>></text></view>
        <view class='nav-item' @click='go(plan)'><text>训练计划</text><text class='nav-arrow'>></text></view>
        <view class='nav-item' @click='go(history)'><text>训练历史</text><text class='nav-arrow'>></text></view>
        <view class='nav-item' @click='go(pr)'><text>PR记录</text><text class='nav-arrow'>></text></view>
        <view class='nav-item' @click='go(stats)'><text>训练统计</text><text class='nav-arrow'>></text></view>
      </view>
    </view>

    <view class='card about-card'>
      <view class='about-title'>健身小程序</view>
      <view class='about-row'><text>版本</text><text class='muted'>1.0.0</text></view>
      <view class='about-row'><text>技术栈</text><text class='muted'>uni-app + Node.js</text></view>
      <view class='about-tip'>记录每一次训练，遇见更好的自己</view>
    </view>
  </view>
</template>

<script setup lang='ts'>
import { ref, reactive, onMounted } from 'vue'
import { api, type UserProfileInfo } from '../../api'
import { nav } from '../../utils/nav'

const genderLabels = ['男', '女', '其他']
const genderValues = ['MALE', 'FEMALE', 'OTHER']
const body = '/pages/body/body'
const exercise = '/pages/exercise/exercise'
const plan = '/pages/plan/plan'
const history = '/pages/history/history'
const pr = '/pages/pr/pr'
const stats = '/pages/stats/stats'
function go(url: string) { nav(url) }
const profile = ref<UserProfileInfo | null>(null)
const form = reactive({ birthDate: '', heightCm: '', goal: '', dailyCalorieGoal: '', dailyProteinGoal: '', weeklyTrainGoal: '', targetWeightKg: '' })
const genderIndex = ref(0)
const hasGender = ref(false)

onMounted(load)

async function load() {
  try {
    const p = await api.getProfile()
    profile.value = p
    if (p) {
      form.birthDate = p.birthDate || ''
      form.heightCm = p.heightCm == null ? '' : String(p.heightCm)
      form.goal = p.goal || ''
      form.dailyCalorieGoal = p.dailyCalorieGoal == null ? '' : String(p.dailyCalorieGoal)
      form.dailyProteinGoal = p.dailyProteinGoal == null ? '' : String(p.dailyProteinGoal)
      form.weeklyTrainGoal = p.weeklyTrainGoal == null ? '' : String(p.weeklyTrainGoal)
      form.targetWeightKg = p.targetWeightKg == null ? '' : String(p.targetWeightKg)
      const gi = p.gender ? genderValues.indexOf(p.gender) : -1
      genderIndex.value = gi >= 0 ? gi : 0
      hasGender.value = gi >= 0
    }
  } catch {}
}

function onGender(e: any) { genderIndex.value = Number(e.detail.value); hasGender.value = true }
function onBirth(e: any) { form.birthDate = e.detail.value }

function toNum(v: string): number | null {
  if (v === '') return null
  const n = Number(v)
  return isNaN(n) ? null : n
}

async function onSave() {
  const data = {
    gender: hasGender.value ? genderValues[genderIndex.value] : null,
    birthDate: form.birthDate || null,
    heightCm: toNum(form.heightCm),
    goal: form.goal || null,
    dailyCalorieGoal: toNum(form.dailyCalorieGoal),
    dailyProteinGoal: toNum(form.dailyProteinGoal),
    weeklyTrainGoal: toNum(form.weeklyTrainGoal),
    targetWeightKg: toNum(form.targetWeightKg),
  }
  try {
    const p = await api.upsertProfile(data)
    profile.value = p
    uni.showToast({ title: '已保存', icon: 'success' })
  } catch {}
}
</script>

<style>
.page { padding: 24rpx; }
.title { font-size: 36rpx; font-weight: bold; margin-bottom: 24rpx; text-align: center; }
.card { background: #fff; border-radius: 16rpx; padding: 24rpx; margin-bottom: 24rpx; }
.section-title { font-size: 30rpx; font-weight: bold; color: #333; margin-bottom: 20rpx; }
.row { display: flex; align-items: center; margin-bottom: 24rpx; }
.label { width: 180rpx; color: #666; }
.picker { flex: 1; }
.input { flex: 1; border: 1rpx solid #ddd; border-radius: 8rpx; padding: 12rpx; }
.muted { color: #999; font-size: 26rpx; margin-bottom: 16rpx; }
.btn-primary { background: #007aff; color: #fff; }
.nav-list { background: #fff; border-radius: 12rpx; overflow: hidden; }
.nav-item { display: flex; justify-content: space-between; align-items: center; padding: 24rpx; border-bottom: 1rpx solid #f5f5f5; font-size: 28rpx; color: #333; }
.nav-arrow { color: #ccc; font-size: 32rpx; }
.about-card { text-align: center; }
.about-title { font-size: 32rpx; font-weight: bold; color: #333; margin-bottom: 16rpx; }
.about-row { display: flex; justify-content: space-between; padding: 8rpx 0; font-size: 26rpx; color: #666; }
.about-tip { font-size: 24rpx; color: #bbb; margin-top: 16rpx; }
</style>