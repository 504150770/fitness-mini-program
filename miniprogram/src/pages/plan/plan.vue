<template>
  <view class='page'>
    <view class='title'>训练计划</view>
    <view class='card'><button class='btn-add' @click='onAdd'>+ 创建训练日</button></view>

    <view v-if='showForm' class='overlay'>
      <view class='form-card'>
        <view class='form-title'>{{ editing ? '编辑训练日' : '创建训练日' }}</view>
        <view class='row'><text class='label'>名称</text><input class='input' v-model='form.name' placeholder='如 推日/拉日/腿日' /></view>
        <view class='row'><text class='label'>备注</text><input class='input' v-model='form.note' placeholder='可选' /></view>
        <view class='form-btns'>
          <button @click='showForm = false'>取消</button>
          <button class='btn-primary' @click='onSave'>保存</button>
        </view>
      </view>
    </view>

    <view v-for='p in plans' :key='p.id' class='card item' @click='goDetail(p.id)'>
      <view class='item-main'>
        <text class='item-name'>{{ p.name }}</text>
        <text class='count'>{{ p.exercises.length }} 个动作</text>
      </view>
      <text v-if='p.note' class='muted'>{{ p.note }}</text>
      <view class='item-actions' @click.stop=''>
        <button size='mini' @click='onEdit(p)'>编辑</button>
        <button size='mini' class='btn-warn' @click='onDelete(p)'>删除</button>
      </view>
    </view>
    <view v-if='plans.length === 0' class='muted center'>暂无训练日，点击上方创建</view>
  </view>
</template>

<script setup lang='ts'>
import { ref, reactive, onMounted } from 'vue'
import { api, type PlanInfo } from '../../api'

const plans = ref<PlanInfo[]>([])
const showForm = ref(false)
const editing = ref<PlanInfo | null>(null)
const form = reactive({ name: '', note: '' })

onMounted(load)

async function load() {
  try { plans.value = await api.getPlans() } catch {}
}

function goDetail(id: string) { uni.navigateTo({ url: '/pages/plan-detail/plan-detail?id=' + id }) }

function onAdd() { editing.value = null; form.name = ''; form.note = ''; showForm.value = true }
function onEdit(p: PlanInfo) { editing.value = p; form.name = p.name; form.note = p.note || ''; showForm.value = true }

async function onSave() {
  if (!form.name.trim()) { uni.showToast({ title: '名称不能为空', icon: 'none' }); return }
  try {
    if (editing.value) { await api.updatePlan(editing.value.id, { name: form.name, note: form.note || undefined }) }
    else { await api.createPlan({ name: form.name, note: form.note || undefined }) }
    showForm.value = false
    uni.showToast({ title: '已保存', icon: 'success' })
    await load()
  } catch {}
}

async function onDelete(p: PlanInfo) {
  uni.showModal({
    title: '确认删除', content: '删除 ' + p.name + ' ?',
    success: async (r) => { if (!r.confirm) return; try { await api.deletePlan(p.id); uni.showToast({ title: '已删除', icon: 'success' }); await load() } catch {} },
  })
}
</script>

<style>
.page { padding: 24rpx; }
.title { font-size: 36rpx; font-weight: bold; margin-bottom: 24rpx; text-align: center; }
.card { background: #fff; border-radius: 16rpx; padding: 24rpx; margin-bottom: 16rpx; }
.btn-add { background: #34c759; color: #fff; }
.overlay { position: fixed; top: 0; left: 0; right: 0; bottom: 0; background: rgba(0,0,0,0.5); z-index: 999; display: flex; align-items: center; justify-content: center; }
.form-card { background: #fff; border-radius: 16rpx; padding: 32rpx; width: 86%; }
.form-title { font-size: 32rpx; font-weight: bold; margin-bottom: 24rpx; text-align: center; }
.row { display: flex; align-items: center; margin-bottom: 24rpx; }
.label { width: 120rpx; color: #666; }
.input { flex: 1; border: 1rpx solid #ddd; border-radius: 8rpx; padding: 12rpx; }
.form-btns { display: flex; gap: 16rpx; }
.form-btns button { flex: 1; }
.btn-primary { background: #007aff; color: #fff; }
.item { }
.item-main { display: flex; align-items: center; justify-content: space-between; }
.item-name { font-size: 32rpx; font-weight: bold; }
.count { color: #007aff; font-size: 26rpx; }
.muted { color: #999; font-size: 26rpx; display: block; margin-top: 8rpx; }
.center { text-align: center; padding: 48rpx; }
.item-actions { display: flex; gap: 12rpx; margin-top: 16rpx; }
.item-actions button { flex: 1; }
.btn-warn { background: #ff3b30; color: #fff; }
</style>