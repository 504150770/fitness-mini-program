<template>
  <view class='page'>
    <view class='title'>用户资料</view>
    <view class='card'>
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
      <button class='btn-primary' @click='onSave'>保存资料</button>
    </view>
  </view>
</template>

<script setup lang='ts'>
import { ref, reactive, onMounted } from 'vue'
import { api, type UserProfileInfo } from '../../api'

const genderLabels = ['男', '女', '其他']
const genderValues = ['MALE', 'FEMALE', 'OTHER']
const profile = ref<UserProfileInfo | null>(null)
const form = reactive({ birthDate: '', heightCm: '', goal: '' })
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
      const gi = p.gender ? genderValues.indexOf(p.gender) : -1
      genderIndex.value = gi >= 0 ? gi : 0
      hasGender.value = gi >= 0
    }
  } catch {}
}

function onGender(e: any) { genderIndex.value = Number(e.detail.value); hasGender.value = true }
function onBirth(e: any) { form.birthDate = e.detail.value }

async function onSave() {
  const data = {
    gender: hasGender.value ? genderValues[genderIndex.value] : null,
    birthDate: form.birthDate || null,
    heightCm: form.heightCm === '' ? null : Number(form.heightCm),
    goal: form.goal || null,
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
.row { display: flex; align-items: center; margin-bottom: 24rpx; }
.label { width: 160rpx; color: #666; }
.picker { flex: 1; }
.input { flex: 1; border: 1rpx solid #ddd; border-radius: 8rpx; padding: 12rpx; }
.muted { color: #999; font-size: 26rpx; margin-bottom: 16rpx; }
.btn-primary { background: #007aff; color: #fff; }
</style>