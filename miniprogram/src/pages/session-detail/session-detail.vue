<template>
  <view class='page'>
    <view class='card'>
      <view class='session-head'>
        <text class='session-name'>{{ session?.name || '加载中...' }}</text>
        <text class='status-badge' :class='session?.status === "ACTIVE" ? "badge-active" : "badge-done"'>{{ session?.status === "ACTIVE" ? "进行中" : "已完成" }}</text>
      </view>
      <view v-if='session' class='meta'>
        <text class='muted'>{{ formatDate(session.startedAt) }}</text>
        <text v-if='session.endedAt' class='muted'>时长 {{ duration }}</text>
        <text class='vol'>总容量 {{ session.totalVolumeKg }}kg</text>
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
      </view>
    </view>
    <view v-if='session && session.logs.length === 0' class='muted center'>本次训练暂无记录</view>
  </view>
</template>

<script setup lang='ts'>
import { ref, computed, onMounted } from 'vue'
import { api, type SessionInfo, type SessionLog } from '../../api'

const sessionId = ref('')
const session = ref<SessionInfo | null>(null)

const exerciseGroups = computed(() => {
  if (!session.value) return []
  const map: Record<string, { exerciseId: string; exerciseName: string; logs: SessionLog[] }> = {}
  for (const log of session.value.logs) {
    if (!map[log.exerciseId]) map[log.exerciseId] = { exerciseId: log.exerciseId, exerciseName: log.exerciseName, logs: [] }
    map[log.exerciseId].logs.push(log)
  }
  return Object.values(map)
})

const duration = computed(() => {
  if (!session.value?.endedAt) return ''
  const ms = new Date(session.value.endedAt).getTime() - new Date(session.value.startedAt).getTime()
  const min = Math.round(ms / 60000)
  if (min < 60) return min + '分钟'
  return Math.floor(min / 60) + '小时' + (min % 60) + '分'
})

onMounted(() => {
  const pages = getCurrentPages()
  const cur = pages[pages.length - 1] as any
  sessionId.value = cur?.options?.id || ''
  loadSession()
})

async function loadSession() { try { session.value = await api.getSession(sessionId.value) } catch {} }
function formatDate(iso: string): string {
  const d = new Date(iso)
  return d.getFullYear() + '-' + (d.getMonth() + 1) + '-' + d.getDate() + ' ' + d.getHours() + ':' + String(d.getMinutes()).padStart(2, '0')
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
.meta { display: flex; gap: 16rpx; margin-top: 12rpx; flex-wrap: wrap; }
.muted { color: #999; font-size: 26rpx; }
.vol { color: #007aff; font-weight: bold; font-size: 26rpx; }
.ex-head { display: flex; align-items: center; justify-content: space-between; margin-bottom: 12rpx; }
.ex-name { font-size: 32rpx; font-weight: bold; }
.log-row { display: flex; align-items: center; gap: 12rpx; padding: 12rpx 0; border-bottom: 1rpx solid #f5f5f5; }
.log-set { width: 100rpx; color: #666; font-size: 26rpx; }
.log-data { flex: 1; font-weight: bold; }
.log-vol { color: #007aff; font-size: 26rpx; }
.pr-badge { background: #ff9500; color: #fff; font-size: 20rpx; padding: 2rpx 8rpx; border-radius: 4rpx; }
.center { text-align: center; padding: 48rpx; }
</style>