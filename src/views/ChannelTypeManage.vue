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
          <el-table :data="channelList" stripe v-loading="loading">
            <el-table-column prop="id" label="ID" width="80" />
            <el-table-column prop="name" label="频道名称" min-width="150">
              <template #default="{ row }">
                <el-tag :color="row.color" effect="dark" size="large">
                  {{ row.name }}
                </el-tag>
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
            <el-table-column prop="sortOrder" label="排序" width="80" align="center" />
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

          <el-empty v-if="!loading && channelList.length === 0" description="暂无频道类型，点击上方按钮新增" />
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
          <div class="color-picker-row">
            <el-color-picker v-model="form.color" show-alpha />
            <el-input v-model="form.color" placeholder="#409EFF" style="width: 140px; margin-left: 12px" />
            <el-button @click="form.color = ''" size="small" style="margin-left: 8px">清除</el-button>
          </div>
          <div class="preset-colors">
            <div
              v-for="c in presetColors"
              :key="c"
              class="preset-color-dot"
              :class="{ active: form.color === c }"
              :style="{ backgroundColor: c }"
              @click="form.color = c"
            />
          </div>
        </el-form-item>
        <el-form-item label="排序" prop="sortOrder">
          <el-input-number v-model="form.sortOrder" :min="0" :max="999" />
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
import { ref, onMounted } from 'vue'
import { useAuthStore } from '@/store/auth'
import { channelTypeApi } from '@/api/channelType'
import { ElMessage, ElMessageBox } from 'element-plus'
import { Headset, Star, CollectionTag, Plus, Refresh } from '@element-plus/icons-vue'

const authStore = useAuthStore()

const loading = ref(false)
const channelList = ref([])
const showDialog = ref(false)
const isEdit = ref(false)
const submitLoading = ref(false)
const formRef = ref(null)
const editingId = ref(null)

const form = ref({
  name: '',
  color: '',
  sortOrder: 0
})

const rules = {
  name: [
    { required: true, message: '请输入频道名称', trigger: 'blur' },
    { max: 50, message: '频道名称不能超过50个字符', trigger: 'blur' }
  ]
}

const presetColors = [
  '#409EFF', '#67C23A', '#E6A23C', '#F56C6C',
  '#909399', '#5470C6', '#91CC75', '#FAC858',
  '#EE6666', '#73C0DE', '#3BA272', '#FC8452',
  '#9A60B4', '#EA7CCC', '#00BCD4', '#FF9800'
]

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
  form.value = { name: '', color: '', sortOrder: 0 }
  showDialog.value = true
}

const openEditDialog = (row) => {
  isEdit.value = true
  editingId.value = row.id
  form.value = {
    name: row.name,
    color: row.color || '',
    sortOrder: row.sortOrder || 0
  }
  showDialog.value = true
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
      sortOrder: form.value.sortOrder
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

.color-picker-row {
  display: flex;
  align-items: center;
}

.preset-colors {
  display: flex;
  gap: 8px;
  margin-top: 8px;
  flex-wrap: wrap;
}

.preset-color-dot {
  width: 24px;
  height: 24px;
  border-radius: 4px;
  border: 2px solid transparent;
  cursor: pointer;
  transition: all 0.2s;
}

.preset-color-dot:hover {
  transform: scale(1.2);
}

.preset-color-dot.active {
  border-color: #333;
  transform: scale(1.15);
}

:deep(.el-tag) {
  font-size: 14px;
}
</style>
