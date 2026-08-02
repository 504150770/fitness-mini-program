<template>
  <view class='page'>
    <view class='home-grid'>
      <view class='home-card' @click='go("/pages/history/history")'>
        <text class='home-val'>{{ home?.streak ?? '-' }}</text>
        <text class='home-label'>连续打卡</text>
        <text v-if='home?.todayTraining' class='home-sub'>{{ home.todayTraining.status === "ACTIVE" ? "训练中" : "已训练" }}</text>
        <text v-else class='home-sub'>今日未练</text>
      </view>
      <view class='home-card' @click='go("/pages/diet/diet")'>
        <text class='home-val'>{{ home?.todayDiet.caloriesKcal ?? '-' }}</text>
        <text class='home-label'>今日热量kcal</text>
        <text class='home-sub'>{{ home?.checkIn.hasDiet ? "已记录" : "未记录" }}</text>
      </view>
      <view class='home-card' @click='go("/pages/body/body")'>
        <text class='home-val'>{{ home?.currentWeight != null ? home.currentWeight : '-' }}</text>
        <text class='home-label'>当前体重kg</text>
        <text class='home-sub'>点击记录</text>
      </view>
      <view class='home-card' @click='onFreeTrain'>
        <text class='home-val'>+</text>
        <text class='home-label'>开始训练</text>
        <text class='home-sub'>点击开始</text>
      </view>
    </view>

    <view class='card'>
      <view class='row'>模块导航</view>
      <button @click='go("/pages/profile/profile")'>用户资料</button>
      <button @click='go("/pages/body/body")'>身体数据</button>
      <button @click='go("/pages/exercise/exercise")'>动作库</button>
      <button @click='go("/pages/plan/plan")'>训练计划</button>
      <button @click='go("/pages/history/history")'>训练历史</button>
      <button @click='go("/pages/diet/diet")'>饮食记录</button>
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

const home = ref<HomeData | null>(null)
const userInfo = ref('')
const openid = ref('tester001')
const hasToken = computed(() => !!getToken())

onMounted(() => { if (hasToken.value) { loadHome(); onMe() } })

async function loadHome() { try { home.value = await api.getHome() } catch {} }
function go(url: string) { uni.navigateTo({ url }) }

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
.card { background: #fff; border-radius: 16rpx; padding: 24rpx; margin-bottom: 24rpx; }
.row { margin-bottom: 16rpx; color: #333; font-weight: bold; }
.input { border: 1rpx solid #ddd; border-radius: 8rpx; padding: 12rpx; margin-bottom: 16rpx; }
.btn-primary { background: #007aff; color: #fff; }
button { margin-top: 12rpx; }
</style>