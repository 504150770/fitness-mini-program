<template>
  <view class='page'>
    <view class='title'>动作库</view>

    <view class='card'>
      <input class='search' v-model='search' placeholder='搜索动作名称' confirm-type='search' @confirm='load' />
    </view>

    <scroll-view scroll-x class='tabs'>
      <view v-for='c in cats' :key='c.value' class='tab' :class='{ active: category === c.value }' @click='onCat(c.value)'>{{ c.label }}</view>
    </scroll-view>

    <view class='card'>
      <button class='btn-add' @click='onAdd'>+ 添加自定义动作</button>
    </view>

    <view v-if='showForm' class='overlay'>
      <view class='form-card'>
        <view class='form-title'>{{ editing ? '编辑动作' : '新建动作' }}</view>
        <view class='row'><text class='label'>名称</text><input class='input' v-model='form.name' placeholder='动作名称' /></view>
        <view class='row'>
          <text class='label'>分类</text>
          <picker mode='selector' :range='catLabels' :value='catIndex' @change='onCatPick' class='picker'>
            <text>{{ catLabels[catIndex] }}</text>
          </picker>
        </view>
        <view class='row'><text class='label'>肌群</text><input class='input' v-model='form.muscleGroup' placeholder='可选' /></view>
        <view class='form-btns'>
          <button @click='showForm = false'>取消</button>
          <button class='btn-primary' @click='onSave'>保存</button>
        </view>
      </view>
    </view>

    <view v-for='e in exercises' :key='e.id' class='card item' @click='goDetail(e.id)'>
      <view class='item-main'>
        <text class='item-name'>{{ e.name }}</text>
        <text class='tag' :class='e.isSystem ? "tag-sys" : "tag-user"'>{{ e.isSystem ? '系统' : '自定义' }}</text>
      </view>
      <view class='item-sub'>
        <text class='cat-badge'>{{ catLabel(e.category) }}</text>
        <text v-if='e.muscleGroup' class='muted'>{{ e.muscleGroup }}</text>
      </view>
      <view v-if='!e.isSystem' class='item-actions'>
        <button size='mini' @click.stop='onEdit(e)'>编辑</button>
        <button size='mini' class='btn-warn' @click.stop='onDelete(e)'>删除</button>
      </view>
    </view>

    <view v-if='exercises.length === 0' class='muted center'>暂无动作</view>
  </view>
</template>

<script setup lang='ts'>
import { ref, reactive, computed, onMounted } from 'vue'
import { api, type ExerciseInfo, EXERCISE_CATEGORIES } from '../../api'

const cats = [{ value: '', label: '全部' }, ...EXERCISE_CATEGORIES]
const catLabels = EXERCISE_CATEGORIES.map(c => c.label)

const exercises = ref<ExerciseInfo[]>([])
const search = ref('')
const category = ref('')
const showForm = ref(false)
const editing = ref<ExerciseInfo | null>(null)
const form = reactive({ name: '', muscleGroup: '' })
const catIndex = ref(0)

onMounted(load)

async function load() {
  try {
    exercises.value = await api.getExercises({
      category: category.value || undefined,
      search: search.value || undefined,
    })
  } catch {}
}

function onCat(v: string) { category.value = v; load() }
function goDetail(id: string) { uni.navigateTo({ url: '/pages/exercise-detail/exercise-detail?id=' + id }) }
function catLabel(v: string) { return EXERCISE_CATEGORIES.find(c => c.value === v)?.label || v }

function onCatPick(e: any) { catIndex.value = Number(e.detail.value) }

function onAdd() {
  editing.value = null
  form.name = ''
  form.muscleGroup = ''
  catIndex.value = 0
  showForm.value = true
}

function onEdit(e: ExerciseInfo) {
  editing.value = e
  form.name = e.name
  form.muscleGroup = e.muscleGroup || ''
  catIndex.value = Math.max(0, EXERCISE_CATEGORIES.findIndex(c => c.value === e.category))
  showForm.value = true
}

async function onSave() {
  const data = { name: form.name, category: EXERCISE_CATEGORIES[catIndex.value].value, muscleGroup: form.muscleGroup || undefined }
  try {
    if (editing.value) {
      await api.updateExercise(editing.value.id, data)
    } else {
      await api.createExercise(data)
    }
    showForm.value = false
    uni.showToast({ title: '已保存', icon: 'success' })
    await load()
  } catch {}
}

async function onDelete(e: ExerciseInfo) {
  uni.showModal({
    title: '确认删除',
    content: '删除 ' + e.name + ' ?',
    success: async (r) => {
      if (!r.confirm) return
      try { await api.deleteExercise(e.id); uni.showToast({ title: '已删除', icon: 'success' }); await load() } catch {}
    },
  })
}
</script>

<style>
.page { padding: 24rpx; }
.title { font-size: 36rpx; font-weight: bold; margin-bottom: 24rpx; text-align: center; }
.card { background: #fff; border-radius: 16rpx; padding: 24rpx; margin-bottom: 16rpx; }
.search { border: 1rpx solid #ddd; border-radius: 8rpx; padding: 12rpx; }
.tabs { white-space: nowrap; margin-bottom: 16rpx; }
.tab { display: inline-block; padding: 12rpx 28rpx; margin-right: 12rpx; border-radius: 8rpx; background: #fff; font-size: 28rpx; color: #666; }
.tab.active { background: #007aff; color: #fff; }
.btn-add { background: #34c759; color: #fff; font-size: 28rpx; }
.overlay { position: fixed; top: 0; left: 0; right: 0; bottom: 0; background: rgba(0,0,0,0.5); z-index: 999; display: flex; align-items: center; justify-content: center; }
.form-card { background: #fff; border-radius: 16rpx; padding: 32rpx; width: 86%; }
.form-title { font-size: 32rpx; font-weight: bold; margin-bottom: 24rpx; text-align: center; }
.row { display: flex; align-items: center; margin-bottom: 24rpx; }
.label { width: 120rpx; color: #666; }
.input { flex: 1; border: 1rpx solid #ddd; border-radius: 8rpx; padding: 12rpx; }
.picker { flex: 1; }
.form-btns { display: flex; gap: 16rpx; }
.form-btns button { flex: 1; }
.btn-primary { background: #007aff; color: #fff; }
.item { }
.item-main { display: flex; align-items: center; justify-content: space-between; }
.item-name { font-size: 32rpx; font-weight: bold; }
.tag { font-size: 22rpx; padding: 4rpx 12rpx; border-radius: 6rpx; }
.tag-sys { background: #e0e0e0; color: #666; }
.tag-user { background: #34c759; color: #fff; }
.item-sub { display: flex; align-items: center; gap: 16rpx; margin-top: 8rpx; }
.cat-badge { background: #f0f0f0; border-radius: 6rpx; padding: 4rpx 12rpx; font-size: 24rpx; color: #333; }
.muted { color: #999; font-size: 26rpx; }
.center { text-align: center; padding: 48rpx; }
.item-actions { display: flex; gap: 12rpx; margin-top: 16rpx; }
.item-actions button { flex: 1; }
.btn-warn { background: #ff3b30; color: #fff; }
</style>