<template>
  <view class='page'>
    <view class='title'>训练统计</view>

    <view v-if='stats' class='stats-grid'>
      <view class='stat-card'><text class='stat-val'>{{ stats.totalSessions }}</text><text class='stat-label'>总训练次数</text></view>
      <view class='stat-card'><text class='stat-val'>{{ stats.trainingDaysThisMonth }}</text><text class='stat-label'>本月训练天</text></view>
      <view class='stat-card'><text class='stat-val'>{{ stats.totalVolumeKg }}</text><text class='stat-label'>总容量kg</text></view>
      <view class='stat-card'><text class='stat-val'>{{ stats.totalSets }}</text><text class='stat-label'>总组数</text></view>
      <view class='stat-card'><text class='stat-val'>{{ stats.prCount }}</text><text class='stat-label'>PR数量</text></view>
    </view>

    <view v-if='stats' class='card'>
      <view class='section-title'>近7天训练容量</view>
      <view class='chart'>
        <view v-for='d in stats.weeklyVolume' :key='d.date' class='chart-col'>
          <text class='chart-val'>{{ d.volume > 0 ? d.volume : '' }}</text>
          <view class='chart-bar vol-bar' :style='volHeight(d.volume)'></view>
          <text class='chart-date'>{{ d.date }}</text>
        </view>
      </view>
    </view>

    <view v-if='stats' class='card'>
      <view class='section-title'>近7天饮食热量</view>
      <view class='chart'>
        <view v-for='d in stats.weeklyCalories' :key='d.date' class='chart-col'>
          <text class='chart-val'>{{ d.calories > 0 ? d.calories : '' }}</text>
          <view class='chart-bar cal-bar' :style='calHeight(d.calories)'></view>
          <text class='chart-date'>{{ d.date }}</text>
        </view>
      </view>
    </view>
  </view>
</template>

<script setup lang='ts'>
import { ref, computed, onMounted } from 'vue'
import { api, type StatsData } from '../../api'

const stats = ref<StatsData | null>(null)

const maxVol = computed(() => {
  if (!stats.value) return 1
  return Math.max(...stats.value.weeklyVolume.map(d => d.volume), 1)
})
const maxCal = computed(() => {
  if (!stats.value) return 1
  return Math.max(...stats.value.weeklyCalories.map(d => d.calories), 1)
})

onMounted(load)

async function load() { try { stats.value = await api.getStats() } catch {} }

function volHeight(v: number) {
  return { height: Math.max(8, (v / maxVol.value) * 80) + '%' }
}
function calHeight(c: number) {
  return { height: Math.max(8, (c / maxCal.value) * 80) + '%' }
}
</script>

<style>
.page { padding: 24rpx; }
.title { font-size: 36rpx; font-weight: bold; margin-bottom: 24rpx; text-align: center; }
.stats-grid { display: flex; flex-wrap: wrap; gap: 16rpx; margin-bottom: 24rpx; }
.stat-card { width: calc(33.33% - 12rpx); background: #fff; border-radius: 16rpx; padding: 24rpx; text-align: center; box-sizing: border-box; }
.stat-val { font-size: 40rpx; font-weight: bold; color: #007aff; display: block; }
.stat-label { font-size: 22rpx; color: #999; display: block; margin-top: 4rpx; }
.card { background: #fff; border-radius: 16rpx; padding: 24rpx; margin-bottom: 16rpx; }
.section-title { font-size: 30rpx; font-weight: bold; margin-bottom: 16rpx; }
.chart { display: flex; align-items: flex-end; height: 300rpx; gap: 12rpx; padding: 16rpx 0; }
.chart-col { display: flex; flex-direction: column; align-items: center; flex: 1; height: 100%; justify-content: flex-end; }
.chart-val { font-size: 20rpx; color: #333; margin-bottom: 4rpx; }
.chart-bar { width: 100%; max-width: 60rpx; border-radius: 8rpx 8rpx 0 0; }
.vol-bar { background: linear-gradient(180deg, #007aff, #4da6ff); }
.cal-bar { background: linear-gradient(180deg, #ff9500, #ffb84d); }
.chart-date { font-size: 20rpx; color: #999; margin-top: 4rpx; }
</style>