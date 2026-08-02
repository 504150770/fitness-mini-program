<template>
  <view class='page'>
    <view class='title'>个人最佳 PR</view>

    <view v-if='prs.length === 0' class='muted center'>
      暂无 PR 记录
      开始训练并记录重量即可自动追踪
    </view>

    <view v-for='pr in sortedPRs' :key='pr.id' class='card pr-card'>
      <view class='pr-head'>
        <text class='pr-name'>{{ pr.exerciseName }}</text>
        <text class='pr-weight'>{{ pr.maxWeightKg }}kg</text>
      </view>
      <view class='pr-sub'>
        <text class='muted'>{{ pr.maxWeightReps }} 次</text>
        <text class='muted'>{{ formatDate(pr.achievedAt) }}</text>
      </view>
    </view>
  </view>
</template>

<script setup lang='ts'>
import { ref, computed, onMounted } from 'vue'
import { api, type PersonalRecordInfo } from '../../api'

const prs = ref<PersonalRecordInfo[]>([])

const sortedPRs = computed(() => [...prs.value].sort((a, b) => b.maxWeightKg - a.maxWeightKg))

onMounted(load)

async function load() { try { prs.value = await api.getPRs() } catch {} }
function formatDate(iso: string): string {
  const d = new Date(iso)
  return d.getFullYear() + '-' + (d.getMonth() + 1) + '-' + d.getDate()
}
</script>

<style>
.page { padding: 24rpx; }
.title { font-size: 36rpx; font-weight: bold; margin-bottom: 24rpx; text-align: center; }
.card { background: #fff; border-radius: 16rpx; padding: 24rpx; margin-bottom: 16rpx; }
.pr-card { }
.pr-head { display: flex; align-items: center; justify-content: space-between; }
.pr-name { font-size: 32rpx; font-weight: bold; }
.pr-weight { font-size: 40rpx; font-weight: bold; color: #ff9500; }
.pr-sub { display: flex; gap: 16rpx; margin-top: 8rpx; }
.muted { color: #999; font-size: 26rpx; }
.center { text-align: center; padding: 48rpx; line-height: 1.8; }
</style>