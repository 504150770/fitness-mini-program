<template>
  <view class='page'>
    <view class='card'>
      <view class='ex-head'>
        <text class='ex-name'>{{ data?.exercise.name || '加载中...' }}</text>
        <text class='cat-badge'>{{ catLabel(data?.exercise.category || '') }}</text>
      </view>
      <text v-if='data?.exercise.muscleGroup' class='muted'>目标肌群: {{ data.exercise.muscleGroup }}</text>
      <text class='muted'>{{ data?.exercise.isSystem ? '系统动作' : '自定义动作' }}</text>
    </view>

    <view v-if='data?.pr' class='card pr-card'>
      <view class='pr-head'>
        <text class='section-title'>个人最佳 PR</text>
        <text class='pr-weight'>{{ data.pr.maxWeightKg }}kg</text>
      </view>
      <view class='pr-sub'>
        <text class='muted'>{{ data.pr.maxWeightReps }} 次</text>
        <text class='muted'>{{ formatDate(data.pr.achievedAt) }}</text>
      </view>
    </view>

    <view v-if='data' class='card'>
      <view class='section-title'>最近训练记录</view>
      <view v-if='data.recentLogs.length === 0' class='muted center'>暂无训练记录</view>
      <view v-for='log in data.recentLogs' :key='log.id' class='log-row'>
        <view class='log-main'>
          <text class='log-data'>{{ log.weightKg }}kg x {{ log.reps }} = {{ log.volumeKg }}kg</text>
          <text v-if='log.isPR' class='pr-badge'>PR</text>
        </view>
        <view class='log-sub'>
          <text class='muted'>{{ log.sessionName }}</text>
          <text class='muted'>{{ formatDate(log.sessionDate) }}</text>
        </view>
      </view>
    </view>
  </view>
</template>

<script setup lang='ts'>
import { ref, onMounted } from 'vue'
import { api, type ExerciseDetails, EXERCISE_CATEGORIES } from '../../api'

const data = ref<ExerciseDetails | null>(null)

onMounted(() => {
  const pages = getCurrentPages()
  const cur = pages[pages.length - 1] as any
  const id = cur?.options?.id || ''
  load(id)
})

async function load(id: string) { try { data.value = await api.getExerciseDetails(id) } catch {} }
function catLabel(v: string) { return EXERCISE_CATEGORIES.find(c => c.value === v)?.label || v }
function formatDate(iso: string): string {
  const d = new Date(iso)
  return (d.getMonth() + 1) + '-' + d.getDate()
}
</script>

<style>
.page { padding: 24rpx; }
.card { background: #fff; border-radius: 16rpx; padding: 24rpx; margin-bottom: 16rpx; }
.ex-head { display: flex; align-items: center; gap: 16rpx; margin-bottom: 8rpx; }
.ex-name { font-size: 36rpx; font-weight: bold; }
.cat-badge { background: #f0f0f0; border-radius: 6rpx; padding: 4rpx 12rpx; font-size: 24rpx; color: #333; }
.muted { color: #999; font-size: 26rpx; display: block; margin-top: 4rpx; }
.center { text-align: center; padding: 32rpx; }
.section-title { font-size: 30rpx; font-weight: bold; margin-bottom: 16rpx; display: block; }
.pr-card { border-left: 8rpx solid #ff9500; }
.pr-head { display: flex; align-items: center; justify-content: space-between; }
.pr-weight { font-size: 48rpx; font-weight: bold; color: #ff9500; }
.pr-sub { display: flex; gap: 16rpx; margin-top: 8rpx; }
.log-row { padding: 16rpx 0; border-bottom: 1rpx solid #f5f5f5; }
.log-main { display: flex; align-items: center; gap: 8rpx; }
.log-data { font-size: 30rpx; font-weight: bold; }
.pr-badge { background: #ff9500; color: #fff; font-size: 20rpx; padding: 2rpx 8rpx; border-radius: 4rpx; }
.log-sub { display: flex; gap: 16rpx; margin-top: 4rpx; }
</style>