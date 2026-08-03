<template>
  <view class='page'>
    <view class='home-grid'>
      <view class='home-card' @click='go(history)'>
        <text class='home-val'>{{ home?.streak ?? '-' }}</text>
        <text class='home-label'>连续打卡</text>
        <text v-if='home?.todayTraining' class='home-sub'>{{ home.todayTraining.status === "ACTIVE" ? "训练中" : "已训练" }}</text>
        <text v-else class='home-sub'>今日未练</text>
        <text v-if='home?.goals?.weeklyTrainGoal' class='home-goal'>{{ home.goals.weekSessionsDone }}/{{ home.goals.weeklyTrainGoal }} 训练/周</text>
      </view>
      <view class='home-card' @click='go(diet)'>
        <text class='home-val'>{{ home?.todayDiet.caloriesKcal ?? '-' }}</text>
        <text class='home-label'>今日热量kcal</text>
        <text v-if='home?.goals?.dailyCalorieGoal' class='home-goal'>目标 {{ home.goals.dailyCalorieGoal }}kcal</text>
        <text v-else-if='home?.checkIn.hasDiet' class='home-sub'>已记录</text>
        <text v-else class='home-sub'>未记录</text>
      </view>
      <view class='home-card' @click='go(body)'>
        <text class='home-val'>{{ home?.currentWeight != null ? home.currentWeight : '-' }}</text>
        <text class='home-label'>当前体重kg</text>
        <text v-if='home?.goals?.targetWeightKg' class='home-goal'>目标 {{ home.goals.targetWeightKg }}kg</text>
        <text v-else class='home-sub'>点击记录</text>
      </view>
      <view class='home-card' @click='onFreeTrain'>
        <text class='home-val'>+</text>
        <text class='home-label'>开始训练</text>
        <text class='home-sub'>点击开始</text>
      </view>
    </view>

    <view v-if='hasAnyGoal' class='card'>
      <view class='row'>目标进度</view>
      <view v-if='home?.goals?.dailyCalorieGoal' class='goal-row'>
        <text class='goal-label'>每日热量</text>
        <view class='progress-wrap'>
          <view class='progress-bar'>
            <view class='progress-fill' :style='barWidth(caloriePct)'></view>
          </view>
          <text class='goal-text'>{{ home.todayDiet.caloriesKcal }}/{{ home.goals.dailyCalorieGoal }}kcal</text>
        </view>
      </view>
      <view v-if='home?.goals?.dailyProteinGoal' class='goal-row'>
        <text class='goal-label'>每日蛋白质</text>
        <view class='progress-wrap'>
          <view class='progress-bar'>
            <view class='progress-fill seg-protein' :style='barWidth(proteinPct)'></view>
          </view>
          <text class='goal-text'>{{ home.todayDiet.proteinG }}/{{ home.goals.dailyProteinGoal }}g</text>
        </view>
      </view>
      <view v-if='home?.goals?.weeklyTrainGoal' class='goal-row'>
        <text class='goal-label'>每周训练</text>
        <view class='progress-wrap'>
          <view class='progress-bar'>
            <view class='progress-fill seg-train' :style='barWidth(weekPct)'></view>
          </view>
          <text class='goal-text'>{{ home.goals.weekSessionsDone }}/{{ home.goals.weeklyTrainGoal }}次</text>
        </view>
      </view>
    </view>

    <view class='card'>
      <view class='row'>更多功能</view>
      <button @click='go(body)'>身体数据</button>
      <button @click='go(exercise)'>动作库</button>
      <button @click='go(plan)'>训练计划</button>
      <button @click='go(pr)'>PR记录</button>
      <button @click='go(stats)'>训练统计</button>
    </view>

    <view class='card'>
      <view class='row'>当前用户: {{ userInfo || '未登录' }}</view>
      <input class='input' v-model='openid' placeholder='测试 openid' />
      <button class='btn-primary' @click='onDevLogin'>开发登录</button>
      <button @click='onHealth' :disabled='!hasToken'>健康检查</button>
    </view>
  </view>
</template>

<script setup lang='ts'>
import { ref, computed, onMounted } from 'vue'
import { api, type HomeData } from '../../api'
import { getToken, setToken } from '../../api/token'
import { setPendingExercises } from '../../api/state'
import { nav } from '../../utils/nav'
import { onPullDownRefresh } from '@dcloudio/uni-app'

const home = ref<HomeData | null>(null)
const userInfo = ref('')
const openid = ref('tester001')
const hasToken = computed(() => !!getToken())

const body = '/pages/body/body'
const exercise = '/pages/exercise/exercise'
const plan = '/pages/plan/plan'
const history = '/pages/history/history'
const diet = '/pages/diet/diet'
const pr = '/pages/pr/pr'
const stats = '/pages/stats/stats'

const hasAnyGoal = computed(() => {
  const g = home.value?.goals
  if (!g) return false
  return !!(g.dailyCalorieGoal || g.dailyProteinGoal || g.weeklyTrainGoal)
})
const caloriePct = computed(() => {
  const g = home.value?.goals
  if (!g?.dailyCalorieGoal) return 0
  return Math.min(100, Math.round((home.value!.todayDiet.caloriesKcal / g.dailyCalorieGoal) * 100))
})
const proteinPct = computed(() => {
  const g = home.value?.goals
  if (!g?.dailyProteinGoal) return 0
  return Math.min(100, Math.round((home.value!.todayDiet.proteinG / g.dailyProteinGoal) * 100))
})
const weekPct = computed(() => {
  const g = home.value?.goals
  if (!g?.weeklyTrainGoal) return 0
  return Math.min(100, Math.round((g.weekSessionsDone / g.weeklyTrainGoal) * 100))
})

function barWidth(pct: number) { return { width: pct + '%' } }

onMounted(() => { if (hasToken.value) { loadHome(); onMe() } })
onPullDownRefresh(async () => { if (hasToken.value) { await loadHome(); await onMe() } uni.stopPullDownRefresh() })

async function loadHome() { try { home.value = await api.getHome() } catch {} }
function go(url: string) { nav(url) }

async function onFreeTrain() {
  if (!hasToken.value) { uni.showToast({ title: '请先登录', icon: 'none' }); return }
  try {
    const result = await api.startSession({})
    setPendingExercises([])
    uni.navigateTo({ url: '/pages/session/session?id=' + result.session.id })
  } catch {}
}
async function onDevLogin() {
  try { const d = await api.devLogin(openid.value); setToken(d.token); userInfo.value = d.user.openid; uni.showToast({ title: '登录成功', icon: 'success' }); await loadHome() } catch {}
}
async function onMe() { try { const d = await api.me(); userInfo.value = d.openid } catch {} }
async function onHealth() { try { const d = await api.health(); uni.showToast({ title: d.status + ' / ' + d.env, icon: 'none' }) } catch {} }
</script>

<style>
.page { padding: 24rpx; }
.home-grid { display: flex; flex-wrap: wrap; gap: 16rpx; margin-bottom: 24rpx; }
.home-card { width: calc(50% - 8rpx); background: #fff; border-radius: 16rpx; padding: 24rpx; box-sizing: border-box; text-align: center; }
.home-val { font-size: 48rpx; font-weight: bold; color: #333; display: block; }
.home-label { font-size: 24rpx; color: #999; display: block; margin-top: 4rpx; }
.home-sub { font-size: 22rpx; color: #007aff; display: block; margin-top: 8rpx; }
.home-goal { font-size: 22rpx; color: #34c759; display: block; margin-top: 8rpx; }
.card { background: #fff; border-radius: 16rpx; padding: 24rpx; margin-bottom: 24rpx; }
.row { margin-bottom: 16rpx; color: #333; font-weight: bold; }
.input { border: 1rpx solid #ddd; border-radius: 8rpx; padding: 12rpx; margin-bottom: 16rpx; }
.btn-primary { background: #007aff; color: #fff; }
button { margin-top: 12rpx; }
.goal-row { display: flex; align-items: center; margin-bottom: 20rpx; }
.goal-label { width: 160rpx; color: #666; font-size: 26rpx; }
.progress-wrap { flex: 1; }
.progress-bar { height: 24rpx; border-radius: 12rpx; background: #f0f0f0; overflow: hidden; margin-bottom: 6rpx; }
.progress-fill { height: 100%; background: #007aff; border-radius: 12rpx; }
.seg-protein { background: #34c759; }
.seg-train { background: #ff9500; }
.goal-text { font-size: 22rpx; color: #999; }
</style>