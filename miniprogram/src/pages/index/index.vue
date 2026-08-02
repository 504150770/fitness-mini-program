<template>
  <view class='page'>
    <view class='title'>健身小程序</view>
    <view class='card'>
      <view class='row'>模块导航</view>
      <button @click='go("/pages/profile/profile")'>用户资料</button>
      <button @click='go("/pages/body/body")'>身体数据</button>
      <button @click='go("/pages/exercise/exercise")'>动作库</button>
      <button @click='go("/pages/plan/plan")'>训练计划</button>
      <button @click='go("/pages/history/history")'>训练历史</button>
      <button class='btn-start' @click='onFreeTrain'>自由训练</button>
    </view>
    <view class='card'>
      <view class='row'>健康状态: {{ health || '未检查' }}</view>
      <button class='btn-primary' @click='onHealth'>健康检查</button>
    </view>
    <view class='card'>
      <view class='row'>当前用户: {{ userInfo || '未登录' }}</view>
      <input class='input' v-model='openid' placeholder='测试 openid' />
      <button class='btn-primary' @click='onDevLogin'>开发登录</button>
      <button @click='onMe' :disabled='!hasToken'>读取当前用户</button>
    </view>
    <view class='card'><button @click='onError'>触发错误(测试统一提示)</button></view>
  </view>
</template>

<script setup lang='ts'>
import { ref, computed } from 'vue'
import { api } from '../../api'
import { getToken, setToken } from '../../api/token'
import { setPendingExercises } from '../../api/state'

const health = ref('')
const userInfo = ref('')
const openid = ref('tester001')
const hasToken = computed(() => !!getToken())

function go(url: string) { uni.navigateTo({ url }) }

async function onFreeTrain() {
  try {
    const result = await api.startSession({})
    setPendingExercises([])
    uni.navigateTo({ url: '/pages/session/session?id=' + result.session.id })
  } catch {}
}
async function onHealth() { try { const d = await api.health(); health.value = d.status + ' / ' + d.env } catch {} }
async function onDevLogin() { try { const d = await api.devLogin(openid.value); setToken(d.token); userInfo.value = d.user.openid; uni.showToast({ title: '登录成功', icon: 'success' }) } catch {} }
async function onMe() { try { const d = await api.me(); userInfo.value = d.openid } catch {} }
async function onError() { try { await api.testError() } catch {} }
</script>

<style>
.page { padding: 24rpx; }
.title { font-size: 36rpx; font-weight: bold; margin-bottom: 24rpx; text-align: center; }
.card { background: #fff; border-radius: 16rpx; padding: 24rpx; margin-bottom: 24rpx; }
.row { margin-bottom: 16rpx; color: #333; }
.input { border: 1rpx solid #ddd; border-radius: 8rpx; padding: 12rpx; margin-bottom: 16rpx; }
.btn-primary { background: #007aff; color: #fff; }
.btn-start { background: #ff9500; color: #fff; }
button { margin-top: 12rpx; }
</style>