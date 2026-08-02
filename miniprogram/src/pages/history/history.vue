<template>
  <view class='page'>
    <view class='title'>训练历史</view>
    <view v-for='s in sessions' :key='s.id' class='card item' @click='goDetail(s.id)'>
      <view class='item-head'>
        <text class='item-name'>{{ s.name }}</text>
        <text class='status-badge' :class='s.status === "ACTIVE" ? "badge-active" : "badge-done"'>{{ s.status === "ACTIVE" ? "进行中" : "已完成" }}</text>
      </view>
      <view class='item-sub'>
        <text class='muted'>{{ formatDate(s.startedAt) }}</text>
        <text v-if='s.totalVolumeKg > 0' class='vol'>{{ s.totalVolumeKg }}kg</text>
        <text class='muted'>{{ s.logCount }}组</text>
      </view>
    </view>
    <view v-if='sessions.length === 0' class='muted center'>暂无训练记录</view>
  </view>
</template>

<script setup lang='ts'>
import { ref, onMounted } from 'vue'
import { api, type SessionListItem } from '../../api'

const sessions = ref<SessionListItem[]>([])
onMounted(load)

async function load() { try { sessions.value = await api.getSessions() } catch {} }
function goDetail(id: string) { uni.navigateTo({ url: '/pages/session-detail/session-detail?id=' + id }) }
function formatDate(iso: string): string {
  const d = new Date(iso)
  return (d.getMonth() + 1) + '-' + d.getDate() + ' ' + d.getHours() + ':' + String(d.getMinutes()).padStart(2, '0')
}
</script>

<style>
.page { padding: 24rpx; }
.title { font-size: 36rpx; font-weight: bold; margin-bottom: 24rpx; text-align: center; }
.card { background: #fff; border-radius: 16rpx; padding: 24rpx; margin-bottom: 16rpx; }
.item-head { display: flex; align-items: center; justify-content: space-between; }
.item-name { font-size: 32rpx; font-weight: bold; }
.status-badge { font-size: 22rpx; padding: 4rpx 12rpx; border-radius: 6rpx; }
.badge-active { background: #34c759; color: #fff; }
.badge-done { background: #e0e0e0; color: #666; }
.item-sub { display: flex; gap: 16rpx; margin-top: 8rpx; }
.muted { color: #999; font-size: 26rpx; }
.vol { color: #007aff; font-weight: bold; font-size: 26rpx; }
.center { text-align: center; padding: 48rpx; }
</style>