<template>
  <view class='page'>
    <view class='title'>身体数据</view>

    <view class='card'>
      <view class='row'>
        <text class='label'>当前体重</text>
        <text class='value'>{{ latest ? latest.weightKg + ' kg' : '-' }}</text>
      </view>
      <view v-if='latest' class='muted'>更新于 {{ formatDate(latest.recordedAt) }}</view>
      <view v-if='latest && latest.bodyFatPct != null' class='muted'>体脂率: {{ latest.bodyFatPct }}%</view>
    </view>

    <view class='card'>
      <view class='section-title'>记录体重</view>
      <view class='row'>
        <text class='label'>体重(kg)</text>
        <input class='input' type='digit' v-model='form.weightKg' placeholder='如 75.5' />
      </view>
      <view class='row'>
        <text class='label'>体脂率(%)</text>
        <input class='input' type='digit' v-model='form.bodyFatPct' placeholder='可选' />
      </view>
      <view class='row'>
        <text class='label'>备注</text>
        <input class='input' v-model='form.note' placeholder='如 晨起空腹' />
      </view>
      <button class='btn-primary' @click='onAdd'>添加记录</button>
    </view>

    <view class='card'>
      <view class='section-title'>体重趋势</view>
      <view v-if='chartData.length === 0' class='muted'>暂无数据</view>
      <view v-else class='chart'>
        <view v-for='c in chartData' :key='c.date' class='chart-col'>
          <text class='chart-wt'>{{ c.weightKg }}</text>
          <view class='chart-bar' :style='{ height: c.heightPct + "%" }'></view>
          <text class='chart-date'>{{ c.date }}</text>
        </view>
      </view>
      <view v-if='trendWithDelta.length > 0' class='trend-list'>
        <view v-for='t in trendWithDelta' :key='t.date' class='trend-row'>
          <text class='trend-date'>{{ t.date }}</text>
          <text class='trend-weight'>{{ t.weightKg }} kg</text>
          <text v-if='t.delta != null' class='trend-delta'>{{ deltaText(t.delta) }}</text>
        </view>
      </view>
    </view>

    <view class='card'>
      <view class='section-title'>历史记录</view>
      <view v-if='records.length === 0' class='muted'>暂无记录</view>
      <view v-for='r in records' :key='r.id' class='record-item'>
        <view class='record-main'>
          <text class='record-weight'>{{ r.weightKg }} kg</text>
          <text v-if='r.bodyFatPct != null' class='record-fat'>体脂 {{ r.bodyFatPct }}%</text>
        </view>
        <text class='record-date'>{{ formatDate(r.recordedAt) }}</text>
        <text v-if='r.note' class='record-note'>{{ r.note }}</text>
      </view>
    </view>
  </view>
</template>

<script setup lang='ts'>
import { ref, reactive, computed, onMounted } from 'vue'
import { api, type BodyRecord, type BodyTrendPoint } from '../../api'

const latest = ref<BodyRecord | null>(null)
const records = ref<BodyRecord[]>([])
const trend = ref<BodyTrendPoint[]>([])
const form = reactive({ weightKg: '', bodyFatPct: '', note: '' })

const trendWithDelta = computed(() =>
  trend.value.map((t, i) => ({
    date: t.date,
    weightKg: t.weightKg,
    delta: i > 0 ? +(t.weightKg - trend.value[i - 1].weightKg).toFixed(1) : null,
  })),
)

const chartData = computed(() => {
  if (trend.value.length === 0) return []
  const weights = trend.value.map(t => t.weightKg)
  const min = Math.min(...weights)
  const max = Math.max(...weights)
  const range = max - min || 1
  return trend.value.map(t => ({
    date: t.date.slice(5),
    weightKg: t.weightKg,
    heightPct: Math.max(15, ((t.weightKg - min) / range) * 80 + 20),
  }))
})

onMounted(load)

async function load() {
  try {
    const [lat, recs, tr] = await Promise.all([
      api.getBodyLatest(),
      api.getBodyRecords({ limit: 50 }),
      api.getBodyTrend(30),
    ])
    latest.value = lat
    records.value = recs
    trend.value = tr
  } catch {}
}

function formatDate(iso: string): string {
  const d = new Date(iso)
  return (d.getMonth() + 1) + '-' + d.getDate() + ' ' + d.getHours() + ':' + String(d.getMinutes()).padStart(2, '0')
}

function deltaText(delta: number): string {
  return (delta >= 0 ? '+' : '') + delta.toFixed(1) + ' kg'
}

async function onAdd() {
  const weightKg = Number(form.weightKg)
  if (!weightKg || weightKg <= 0) {
    uni.showToast({ title: '请输入有效体重', icon: 'none' })
    return
  }
  try {
    await api.createBodyRecord({
      weightKg,
      bodyFatPct: form.bodyFatPct ? Number(form.bodyFatPct) : null,
      note: form.note || null,
    })
    form.weightKg = ''
    form.bodyFatPct = ''
    form.note = ''
    uni.showToast({ title: '已记录', icon: 'success' })
    await load()
  } catch {}
}
</script>

<style>
.page { padding: 24rpx; }
.title { font-size: 36rpx; font-weight: bold; margin-bottom: 24rpx; text-align: center; }
.card { background: #fff; border-radius: 16rpx; padding: 24rpx; margin-bottom: 24rpx; }
.section-title { font-size: 30rpx; font-weight: bold; margin-bottom: 16rpx; }
.row { display: flex; align-items: center; margin-bottom: 24rpx; }
.label { width: 160rpx; color: #666; }
.value { font-size: 40rpx; font-weight: bold; }
.input { flex: 1; border: 1rpx solid #ddd; border-radius: 8rpx; padding: 12rpx; }
.muted { color: #999; font-size: 26rpx; margin-bottom: 8rpx; }
.btn-primary { background: #007aff; color: #fff; }
.chart { display: flex; align-items: flex-end; height: 300rpx; gap: 8rpx; padding: 16rpx 0; overflow-x: auto; }
.chart-col { display: flex; flex-direction: column; align-items: center; min-width: 80rpx; height: 100%; justify-content: flex-end; }
.chart-wt { font-size: 20rpx; color: #333; margin-bottom: 4rpx; }
.chart-bar { width: 40rpx; background: linear-gradient(180deg, #007aff, #4da6ff); border-radius: 8rpx 8rpx 0 0; }
.chart-date { font-size: 20rpx; color: #999; margin-top: 4rpx; }
.trend-list { margin-top: 16rpx; }
.trend-row { display: flex; align-items: center; padding: 8rpx 0; border-bottom: 1rpx solid #f0f0f0; }
.trend-date { width: 200rpx; color: #666; font-size: 26rpx; }
.trend-weight { flex: 1; font-weight: bold; }
.trend-delta { color: #999; font-size: 26rpx; }
.record-item { padding: 16rpx 0; border-bottom: 1rpx solid #f0f0f0; }
.record-main { display: flex; align-items: center; }
.record-weight { font-size: 32rpx; font-weight: bold; margin-right: 16rpx; }
.record-fat { color: #666; font-size: 26rpx; }
.record-date { color: #999; font-size: 24rpx; }
.record-note { display: block; color: #666; font-size: 26rpx; margin-top: 4rpx; }
</style>