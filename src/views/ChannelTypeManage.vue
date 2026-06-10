<template>
  <div class="channel-type-layout">
    <header class="header">
      <div class="header-left">
        <h1 class="system-title">抖音短视频分析系统</h1>
      </div>
      <div class="header-right">
        <div class="user-info">
          <el-avatar :size="32" class="user-avatar">
            {{ authStore.user?.username?.charAt(0) }}
          </el-avatar>
          <span class="username">{{ authStore.user?.username }}</span>
        </div>
      </div>
    </header>

    <div class="main-container">
      <nav class="sidebar">
        <el-menu :default-active="$route.path" router class="sidebar-menu">
          <el-menu-item index="/music" class="menu-item">
            <el-icon><Headset /></el-icon>
            <span>音乐管理</span>
          </el-menu-item>
          <el-menu-item index="/favorite-author" class="menu-item">
            <el-icon><Star /></el-icon>
            <span>收藏播主</span>
          </el-menu-item>
          <el-menu-item index="/channel-type" class="menu-item">
            <el-icon><CollectionTag /></el-icon>
            <span>频道类型</span>
          </el-menu-item>
        </el-menu>
      </nav>

      <main class="content">
        <div class="page-header">
          <h2 class="page-title">频道类型管理</h2>
          <p class="page-desc">自定义播主的频道分类，支持多选标签</p>
        </div>

        <div class="toolbar">
          <el-button type="primary" @click="openAddDialog">
            <el-icon><Plus /></el-icon>
            新增频道类型
          </el-button>
          <el-button @click="loadList" :loading="loading">
            <el-icon><Refresh /></el-icon>
            刷新
          </el-button>
        </div>

        <el-card class="table-card">
          <el-table :data="sortedChannelList" stripe v-loading="loading">
            <el-table-column prop="id" label="ID" width="80" />
            <el-table-column prop="name" label="频道名称" min-width="150">
              <template #default="{ row }">
                <span
                  class="type-preview-pill"
                  :style="applyLightPillStyle(row.color || DEFAULT_CHANNEL_COLOR)"
                >
                  {{ row.name }}
                </span>
              </template>
            </el-table-column>
            <el-table-column prop="color" label="标签颜色" width="120" align="center">
              <template #default="{ row }">
                <div class="color-cell" v-if="row.color">
                  <div class="color-dot" :style="{ backgroundColor: row.color }" />
                  <span>{{ row.color }}</span>
                </div>
                <span v-else class="na-text">-</span>
              </template>
            </el-table-column>
            <el-table-column prop="createTime" label="创建时间" width="180">
              <template #default="{ row }">
                {{ formatTime(row.createTime) }}
              </template>
            </el-table-column>
            <el-table-column label="操作" width="180" align="center">
              <template #default="{ row }">
                <el-button type="primary" size="small" link @click="openEditDialog(row)">
                  编辑
                </el-button>
                <el-button type="danger" size="small" link @click="handleDelete(row)">
                  删除
                </el-button>
              </template>
            </el-table-column>
          </el-table>

          <el-empty v-if="!loading && sortedChannelList.length === 0" description="暂无频道类型，点击上方按钮新增" />
        </el-card>
      </main>
    </div>

    <!-- 新增/编辑对话框 -->
    <el-dialog
      v-model="showDialog"
      :title="isEdit ? '编辑频道类型' : '新增频道类型'"
      width="480px"
      :close-on-click-modal="false"
    >
      <el-form :model="form" label-width="100px" :rules="rules" ref="formRef">
        <el-form-item label="频道名称" prop="name">
          <el-input v-model="form.name" placeholder="如：美食、科技、旅行" maxlength="50" />
        </el-form-item>
        <el-form-item label="标签颜色" prop="color">
          <div class="family-row">
            <div
              v-for="fam in COLOR_FAMILIES"
              :key="fam.key"
              class="family-chip"
              :class="{ active: selectedFamilyKey === fam.key }"
              @click="selectFamily(fam.key)"
            >
              <span class="family-dot" :style="{ backgroundColor: fam.shades[fam.defaultShadeIndex].hex }" />
              <span class="family-label">{{ fam.label }}</span>
            </div>
          </div>

          <div class="shade-row" v-if="selectedFamily">
            <span class="shade-label">深浅：</span>
            <div
              v-for="(shade, idx) in selectedFamily.shades"
              :key="idx"
              class="shade-dot"
              :class="{ active: form.color?.toLowerCase() === shade.hex.toLowerCase() }"
              :style="{ backgroundColor: shade.hex }"
              :title="shade.label"
              @click="selectShade(idx)"
            />
          </div>

          <div class="color-footer-row" v-if="form.color && form.name">
            <div class="tag-preview">
              <span class="preview-label">预览</span>
              <span class="preview-pill" :style="applyLightPillStyle(form.color)">
                {{ form.name }}
              </span>
            </div>
            <div class="footer-divider" />
            <div class="custom-color">
              <span class="custom-color-label">自定义</span>
              <el-color-picker v-model="form.color" size="small" />
              <el-input
                v-model="form.color"
                placeholder="#888d95"
                size="small"
                style="width: 110px"
              />
            </div>
          </div>
        </el-form-item>
      </el-form>
      <template #footer>
        <el-button @click="showDialog = false">取消</el-button>
        <el-button type="primary" @click="handleSubmit" :loading="submitLoading">
          {{ isEdit ? '保存' : '新增' }}
        </el-button>
      </template>
    </el-dialog>
  </div>
</template>

<script setup>
import { ref, computed, watch, onMounted } from 'vue'
import { useAuthStore } from '@/store/auth'
import { channelTypeApi } from '@/api/channelType'
import { ElMessage, ElMessageBox } from 'element-plus'
import { Headset, Star, CollectionTag, Plus, Refresh } from '@element-plus/icons-vue'
import {
  COLOR_FAMILIES,
  getFamilyByKeyword,
  getDefaultShade,
  getFamilyByKey,
  applyLightPillStyle,
  DEFAULT_CHANNEL_COLOR,
  getHue,
} from '@/utils/colorSystem'

const authStore = useAuthStore()

const loading = ref(false)
const channelList = ref([])

const sortedChannelList = computed(() => {
  return [...channelList.value].sort((a, b) => {
    const ha = getHue(a.color)
    const hb = getHue(b.color)
    if (ha === hb) return 0
    if (!isFinite(ha)) return 1
    if (!isFinite(hb)) return -1
    return ha - hb
  })
})
const showDialog = ref(false)
const isEdit = ref(false)
const submitLoading = ref(false)
const formRef = ref(null)
const editingId = ref(null)
const selectedFamilyKey = ref('gray')
const selectedShadeIndex = ref(2)

const form = ref({
  name: '',
  color: '',
})

const selectedFamily = computed(() => getFamilyByKey(selectedFamilyKey.value))

watch(() => form.value.name, (newName) => {
  if (!newName || !newName.trim()) {
    selectedFamilyKey.value = 'gray'
    return
  }
  const matched = getFamilyByKeyword(newName.trim())
  selectedFamilyKey.value = matched
  if (!isEdit.value) {
    form.value.color = getDefaultShade(matched)
  }
})

const rules = {
  name: [
    { required: true, message: '请输入频道名称', trigger: 'blur' },
    { max: 50, message: '频道名称不能超过50个字符', trigger: 'blur' }
  ]
}

const loadList = async () => {
  loading.value = true
  try {
    const res = await channelTypeApi.getList()
    if (res.success) {
      channelList.value = res.data || []
    } else {
      ElMessage.error(res.message || '加载频道类型失败')
    }
  } catch (e) {
    console.error('加载频道类型失败:', e)
    ElMessage.error('加载频道类型失败')
  } finally {
    loading.value = false
  }
}

const openAddDialog = () => {
  isEdit.value = false
  editingId.value = null
  form.value = { name: '', color: '' }
  selectedFamilyKey.value = 'gray'
  selectedShadeIndex.value = 2
  showDialog.value = true
}

const openEditDialog = (row) => {
  isEdit.value = true
  editingId.value = row.id
  form.value = {
    name: row.name,
    color: row.color || '',
  }
  const color = (row.color || '').toLowerCase()
  const family = COLOR_FAMILIES.find(f =>
    f.shades.some(s => s.hex.toLowerCase() === color)
  )
  if (family) {
    selectedFamilyKey.value = family.key
    const idx = family.shades.findIndex(s => s.hex.toLowerCase() === color)
    selectedShadeIndex.value = idx >= 0 ? idx : family.defaultShadeIndex
  } else {
    selectedFamilyKey.value = 'gray'
    selectedShadeIndex.value = 2
  }
  showDialog.value = true
}

const selectFamily = (key) => {
  selectedFamilyKey.value = key
  selectedShadeIndex.value = getFamilyByKey(key)?.defaultShadeIndex ?? 2
  form.value.color = getDefaultShade(key)
}

const selectShade = (idx) => {
  selectedShadeIndex.value = idx
  if (selectedFamily.value) {
    form.value.color = selectedFamily.value.shades[idx].hex
  }
}

const handleSubmit = async () => {
  if (!formRef.value) return
  try {
    await formRef.value.validate()
  } catch {
    return
  }

  submitLoading.value = true
  try {
    const params = {
      name: form.value.name.trim(),
      color: form.value.color || undefined,
    }

    let res
    if (isEdit.value) {
      params.id = editingId.value
      res = await channelTypeApi.update(params)
    } else {
      res = await channelTypeApi.add(params)
    }

    if (res.success) {
      ElMessage.success(isEdit.value ? '更新成功' : '新增成功')
      showDialog.value = false
      loadList()
    } else {
      ElMessage.error(res.message || '操作失败')
    }
  } catch (e) {
    console.error('操作频道类型失败:', e)
    ElMessage.error('操作失败')
  } finally {
    submitLoading.value = false
  }
}

const handleDelete = async (row) => {
  try {
    await ElMessageBox.confirm(
      `确认删除频道类型"${row.name}"？删除后所有使用该类型的播主将失去该标签。`,
      '警告',
      { type: 'warning', confirmButtonText: '确认删除', cancelButtonText: '取消' }
    )
    const res = await channelTypeApi.delete(row.id)
    if (res.success) {
      ElMessage.success('删除成功')
      loadList()
    } else {
      ElMessage.error(res.message || '删除失败')
    }
  } catch (e) {
    if (e !== 'cancel') {
      console.error('删除频道类型失败:', e)
      ElMessage.error('删除失败')
    }
  }
}

const formatTime = (time) => {
  if (!time) return '-'
  return new Date(time).toLocaleString('zh-CN')
}

onMounted(() => {
  loadList()
})
</script>

<style scoped>
.channel-type-layout {
  height: 100vh;
  background: #f5f7fa;
  display: flex;
  flex-direction: column;
}

.header {
  height: 64px;
  background: #fff;
  border-bottom: 1px solid #e6e8eb;
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 0 24px;
  box-shadow: 0 1px 4px rgba(0, 21, 41, 0.08);
}

.system-title {
  margin: 0;
  font-size: 20px;
  font-weight: 600;
  color: #1f2937;
}

.user-info {
  display: flex;
  align-items: center;
  gap: 12px;
}

.username {
  font-weight: 500;
  color: #374151;
}

.main-container {
  flex: 1;
  display: flex;
  overflow: hidden;
}

.sidebar {
  width: 140px;
  background: #fff;
  border-right: 1px solid #e6e8eb;
  padding: 16px 0;
}

.sidebar-menu {
  border: none;
}

.menu-item {
  margin: 4px 8px;
  border-radius: 8px;
  justify-content: center;
}

.content {
  flex: 1;
  padding: 24px;
  overflow-y: auto;
}

.page-header {
  margin-bottom: 24px;
}

.page-title {
  margin: 0 0 8px 0;
  font-size: 24px;
  font-weight: 600;
  color: #1f2937;
}

.page-desc {
  margin: 0;
  color: #6b7280;
  font-size: 14px;
}

.toolbar {
  display: flex;
  gap: 12px;
  margin-bottom: 24px;
}

.table-card {
  border-radius: 12px;
  border: 1px solid #e6e8eb;
}

.color-cell {
  display: flex;
  align-items: center;
  gap: 8px;
  justify-content: center;
}

.color-dot {
  width: 16px;
  height: 16px;
  border-radius: 4px;
  border: 1px solid #ddd;
}

.na-text {
  color: #9ca3af;
  font-style: italic;
}

/* Color family picker */
.family-row {
  display: flex;
  gap: 8px;
  flex-wrap: wrap;
  margin-bottom: 12px;
}

.family-chip {
  display: flex;
  align-items: center;
  gap: 6px;
  padding: 6px 12px;
  border-radius: 20px;
  border: 1.5px solid #e4e7ed;
  cursor: pointer;
  transition: all 0.2s;
  background: #fff;
  user-select: none;
}

.family-chip:hover {
  border-color: #c0c4cc;
  background: #f5f7fa;
}

.family-chip.active {
  border-color: #409eff;
  background: #ecf5ff;
  box-shadow: 0 0 0 1px rgba(64, 158, 255, 0.2);
}

.family-dot {
  width: 14px;
  height: 14px;
  border-radius: 50%;
  flex-shrink: 0;
  border: 1px solid rgba(0, 0, 0, 0.1);
}

.family-label {
  font-size: 13px;
  color: #606266;
  font-weight: 500;
}

.family-chip.active .family-label {
  color: #409eff;
}

/* Shade picker */
.shade-row {
  display: flex;
  align-items: center;
  gap: 10px;
  margin-bottom: 12px;
}

.shade-dot {
  width: 28px;
  height: 28px;
  border-radius: 6px;
  border: 2.5px solid transparent;
  cursor: pointer;
  transition: all 0.2s;
}

.shade-dot:hover {
  transform: scale(1.15);
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.15);
}

.shade-dot.active {
  border-color: #303133;
  transform: scale(1.1);
  box-shadow: 0 0 0 2px rgba(0, 0, 0, 0.1);
}

.shade-label {
  font-size: 13px;
  color: #909399;
  flex-shrink: 0;
}

.preview-pill {
  font-size: 14px;
  border-radius: 4px;
  padding: 3px 10px;
  display: inline-block;
  font-weight: 500;
  line-height: 1.5;
}

.type-preview-pill {
  font-size: 14px;
  border-radius: 4px;
  padding: 3px 10px;
  display: inline-block;
  font-weight: 500;
  line-height: 1.5;
  white-space: nowrap;
}

.color-footer-row {
  display: flex;
  align-items: center;
  gap: 12px;
  margin-top: 14px;
  padding: 10px 14px;
  background: #fafbfc;
  border-radius: 8px;
  border: 1px solid #ebeef5;
}

.footer-divider {
  width: 1px;
  height: 28px;
  background: #e4e7ed;
  flex-shrink: 0;
}

.tag-preview {
  display: flex;
  align-items: center;
  gap: 8px;
  flex-shrink: 0;
}

.preview-label {
  font-size: 12px;
  color: #909399;
}

.custom-color {
  display: flex;
  align-items: center;
  gap: 6px;
}

.custom-color-label {
  font-size: 12px;
  color: #909399;
  flex-shrink: 0;
}
</style>
