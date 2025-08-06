<template>
  <div class="music-layout">
    <!-- 头部导航 -->
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
          <el-dropdown @command="handleCommand" class="user-dropdown">
            <el-icon class="dropdown-icon"><ArrowDown /></el-icon>
            <template #dropdown>
              <el-dropdown-menu>
                <el-dropdown-item command="logout">退出登录</el-dropdown-item>
              </el-dropdown-menu>
            </template>
          </el-dropdown>
        </div>
      </div>
    </header>

    <div class="main-container">
      <!-- 侧边导航 -->
      <nav class="sidebar">
        <el-menu
          :default-active="$route.path"
          router
          class="sidebar-menu"
        >
          <el-menu-item index="/dashboard" class="menu-item">
            <el-icon><Odometer /></el-icon>
            <span>数据概览</span>
          </el-menu-item>
          <el-menu-item index="/monitor" class="menu-item">
            <el-icon><View /></el-icon>
            <span>监控管理</span>
          </el-menu-item>
          <el-menu-item index="/music" class="menu-item">
            <el-icon><Headset /></el-icon>
            <span>音乐管理</span>
          </el-menu-item>
        </el-menu>
      </nav>

      <!-- 主内容区 -->
      <main class="content">
        <div class="page-header">
          <h2 class="page-title">音乐管理</h2>
          <p class="page-desc">管理系统中的音乐库，支持音乐的增删改查操作</p>
        </div>

        <!-- 操作栏 -->
        <div class="toolbar">
          <div class="toolbar-left">
            <el-button type="primary" @click="showAddDialog = true" :icon="Plus">
              添加音乐
            </el-button>
            <el-button @click="loadMusicList" :loading="loading" :icon="Refresh">
              刷新
            </el-button>
          </div>
          <div class="toolbar-right">
            <el-input
              v-model="searchKeyword"
              placeholder="搜索音乐标题、作者或专辑"
              :prefix-icon="Search"
              style="width: 300px;"
              clearable
              @input="handleSearch"
            />
          </div>
        </div>

        <!-- 统计卡片 -->
        <div class="stats-row">
          <div class="stat-card total">
            <div class="stat-icon">
              <el-icon size="20"><Headset /></el-icon>
            </div>
            <div class="stat-info">
              <div class="stat-value">{{ filteredMusicList.length }}</div>
              <div class="stat-label">音乐总数</div>
            </div>
          </div>
        </div>

        <!-- 音乐列表 -->
        <el-card class="music-table-card">
          <template #header>
            <div class="card-header">
              <span class="card-title">音乐列表</span>
            </div>
          </template>
          
          <div v-loading="loading">
            <el-table 
              :data="filteredMusicList" 
              style="width: 100%"
              :empty-text="filteredMusicList.length === 0 ? '暂无音乐数据' : ''"
            >
              <el-table-column label="ID" width="80">
                <template #default="{ row }">
                  <span class="music-id">{{ row.id }}</span>
                </template>
              </el-table-column>
              
              <el-table-column label="音乐标题" min-width="200">
                <template #default="{ row }">
                  <div class="music-title">
                    {{ row.title || 'N/A' }}
                  </div>
                </template>
              </el-table-column>
              
              <el-table-column label="作者" min-width="150">
                <template #default="{ row }">
                  <div class="music-author">
                    {{ row.author || 'N/A' }}
                  </div>
                </template>
              </el-table-column>
              
              <el-table-column label="专辑" min-width="150">
                <template #default="{ row }">
                  <div class="music-album">
                    {{ row.album || 'N/A' }}
                  </div>
                </template>
              </el-table-column>
              
              <el-table-column label="标签" min-width="150">
                <template #default="{ row }">
                  <div class="music-tags">
                    <el-tag
                      v-for="tag in (row.tagList || '').split(',').filter(t => t.trim())"
                      :key="tag"
                      size="small"
                      style="margin-right: 5px;"
                    >
                      {{ tag.trim() }}
                    </el-tag>
                    <span v-if="!row.tagList || !row.tagList.trim()" class="na-text">N/A</span>
                  </div>
                </template>
              </el-table-column>
              
              <el-table-column label="创建时间" width="180">
                <template #default="{ row }">
                  {{ formatDate(row.createTime) }}
                </template>
              </el-table-column>
              
              <el-table-column label="操作" width="200" fixed="right">
                <template #default="{ row }">
                  <div class="table-actions">
                    <el-tooltip content="编辑音乐" placement="top">
                      <el-button 
                        type="primary" 
                        size="small" 
                        :icon="Edit"
                        @click="editMusic(row)"
                        link
                      />
                    </el-tooltip>
                    
                    <el-tooltip content="删除音乐" placement="top">
                      <el-button 
                        type="danger" 
                        size="small" 
                        :icon="Delete"
                        @click="deleteMusic(row)"
                        link
                      />
                    </el-tooltip>
                  </div>
                </template>
              </el-table-column>
            </el-table>
          </div>
        </el-card>
      </main>
    </div>

    <!-- 添加/编辑音乐对话框 -->
    <el-dialog
      v-model="showAddDialog"
      :title="editingMusic ? '编辑音乐' : '添加音乐'"
      width="500px"
      @close="resetForm"
    >
      <el-form :model="musicForm" :rules="formRules" ref="formRef" label-width="100px">
        <el-form-item label="音乐标题" prop="title">
          <el-input 
            v-model="musicForm.title" 
            placeholder="请输入音乐标题"
          />
        </el-form-item>
        
        <el-form-item label="作者" prop="author">
          <el-input 
            v-model="musicForm.author" 
            placeholder="请输入作者名称"
          />
        </el-form-item>
        
        <el-form-item label="专辑" prop="album">
          <el-input 
            v-model="musicForm.album" 
            placeholder="请输入专辑名称"
          />
        </el-form-item>
        
        <el-form-item label="标签" prop="tagList">
          <el-input 
            v-model="musicForm.tagList" 
            placeholder="请输入标签，用逗号分隔（如：流行,抒情）"
          />
        </el-form-item>
      </el-form>
      
      <template #footer>
        <el-button @click="showAddDialog = false">取消</el-button>
        <el-button type="primary" @click="handleSubmit" :loading="submitLoading">
          {{ editingMusic ? '更新' : '添加' }}
        </el-button>
      </template>
    </el-dialog>
  </div>
</template>

<script setup>
import { ref, computed, onMounted } from 'vue'
import { useRouter } from 'vue-router'
import { useAuthStore } from '@/store/auth'
import { musicApi } from '@/api/music'
import { ElMessage, ElMessageBox } from 'element-plus'
import {
  Plus,
  Refresh,
  Search,
  Edit,
  Delete,
  Headset,
  Odometer,
  View,
  ArrowDown
} from '@element-plus/icons-vue'

const router = useRouter()
const authStore = useAuthStore()

const loading = ref(false)
const submitLoading = ref(false)
const musicList = ref([])
const searchKeyword = ref('')
const showAddDialog = ref(false)
const editingMusic = ref(null)

const formRef = ref()
const musicForm = ref({
  id: null,
  title: '',
  author: '',
  album: '',
  tagList: ''
})

const formRules = {
  title: [
    { required: true, message: '请输入音乐标题', trigger: 'blur' }
  ],
  author: [
    { required: true, message: '请输入作者名称', trigger: 'blur' }
  ],
  album: [
    { required: true, message: '请输入专辑名称', trigger: 'blur' }
  ]
}

const filteredMusicList = computed(() => {
  if (!searchKeyword.value) return musicList.value
  
  const keyword = searchKeyword.value.toLowerCase()
  return musicList.value.filter(item => {
    return (item.title || '').toLowerCase().includes(keyword) ||
           (item.author || '').toLowerCase().includes(keyword) ||
           (item.album || '').toLowerCase().includes(keyword) ||
           (item.tagList || '').toLowerCase().includes(keyword)
  })
})

const formatDate = (dateStr) => {
  if (!dateStr) return 'N/A'
  return new Date(dateStr).toLocaleString('zh-CN')
}

const loadMusicList = async () => {
  loading.value = true
  try {
    const response = await musicApi.getMusicList()
    if (response.code === 200) {
      musicList.value = response.data || []
    } else {
      ElMessage.error(response.message || '加载音乐列表失败')
    }
  } catch (error) {
    console.error('加载音乐列表失败:', error)
    ElMessage.error('加载音乐列表失败')
  } finally {
    loading.value = false
  }
}

const handleSearch = async () => {
  if (!searchKeyword.value.trim()) {
    return
  }
  
  loading.value = true
  try {
    const response = await musicApi.searchMusic(searchKeyword.value.trim())
    if (response.code === 200) {
      musicList.value = response.data || []
    } else {
      ElMessage.error(response.message || '搜索失败')
    }
  } catch (error) {
    console.error('搜索失败:', error)
    ElMessage.error('搜索失败')
  } finally {
    loading.value = false
  }
}

const resetForm = () => {
  editingMusic.value = null
  musicForm.value = {
    id: null,
    title: '',
    author: '',
    album: '',
    tagList: ''
  }
  if (formRef.value) {
    formRef.value.resetFields()
  }
}

const editMusic = (music) => {
  editingMusic.value = music
  musicForm.value = {
    id: music.id,
    title: music.title || '',
    author: music.author || '',
    album: music.album || '',
    tagList: music.tagList || ''
  }
  showAddDialog.value = true
}

const handleSubmit = async () => {
  if (!formRef.value) return
  
  try {
    await formRef.value.validate()
  } catch (error) {
    return
  }
  
  submitLoading.value = true
  try {
    let response
    if (editingMusic.value) {
      response = await musicApi.updateMusic(musicForm.value)
    } else {
      response = await musicApi.addMusic(musicForm.value)
    }
    
    if (response.code === 200) {
      ElMessage.success(editingMusic.value ? '更新音乐成功' : '添加音乐成功')
      showAddDialog.value = false
      resetForm()
      await loadMusicList()
    } else {
      ElMessage.error(response.message || '操作失败')
    }
  } catch (error) {
    console.error('操作失败:', error)
    ElMessage.error('操作失败')
  } finally {
    submitLoading.value = false
  }
}

const deleteMusic = async (music) => {
  try {
    await ElMessageBox.confirm(`确认删除音乐"${music.title}"？删除后无法恢复`, '警告', {
      type: 'warning',
      confirmButtonText: '确认删除',
      cancelButtonText: '取消'
    })
    
    const response = await musicApi.deleteMusic(music.id)
    if (response.code === 200) {
      ElMessage.success('删除成功')
      await loadMusicList()
    } else {
      if (response.message?.includes('歌曲信息不存在')) {
        ElMessage.error('该音乐不存在或已被删除')
        await loadMusicList() // 刷新列表以同步状态
      } else {
        ElMessage.error(response.message || '删除失败')
      }
    }
  } catch (error) {
    if (error !== 'cancel') {
      console.error('删除失败:', error)
      ElMessage.error('删除失败')
    }
  }
}

const handleCommand = async (command) => {
  if (command === 'logout') {
    try {
      await ElMessageBox.confirm('确认退出登录？', '提示', {
        type: 'warning'
      })
      await authStore.logout()
      router.push('/login')
    } catch (error) {
      // 用户取消
    }
  }
}

onMounted(() => {
  loadMusicList()
})
</script>

<style scoped>
.music-layout {
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

.dropdown-icon {
  color: #6b7280;
  cursor: pointer;
}

.main-container {
  flex: 1;
  display: flex;
  overflow: hidden;
}

.sidebar {
  width: 240px;
  background: #fff;
  border-right: 1px solid #e6e8eb;
  padding: 16px 0;
}

.sidebar-menu {
  border: none;
}

.menu-item {
  margin: 4px 16px;
  border-radius: 8px;
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
  justify-content: space-between;
  align-items: center;
  margin-bottom: 24px;
  padding: 16px 20px;
  background: #fff;
  border-radius: 12px;
  border: 1px solid #e6e8eb;
}

.toolbar-left {
  display: flex;
  gap: 12px;
}

.stats-row {
  display: flex;
  gap: 20px;
  margin-bottom: 24px;
}

.stat-card {
  flex: 1;
  background: #fff;
  border-radius: 12px;
  padding: 20px;
  border: 1px solid #e6e8eb;
  display: flex;
  align-items: center;
  gap: 16px;
  transition: all 0.3s ease;
}

.stat-card:hover {
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.1);
  transform: translateY(-2px);
}

.stat-card.total .stat-icon {
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  color: white;
}

.stat-icon {
  width: 40px;
  height: 40px;
  border-radius: 10px;
  display: flex;
  align-items: center;
  justify-content: center;
}

.stat-info {
  flex: 1;
}

.stat-value {
  font-size: 24px;
  font-weight: 700;
  color: #1f2937;
  line-height: 1;
}

.stat-label {
  font-size: 14px;
  color: #6b7280;
  margin-top: 4px;
}

.music-table-card {
  border-radius: 12px;
  border: 1px solid #e6e8eb;
}

.card-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
}

.card-title {
  font-size: 16px;
  font-weight: 600;
  color: #1f2937;
}

.music-id {
  font-family: 'Consolas', 'Monaco', monospace;
  font-weight: 600;
  color: #374151;
}

.music-title {
  font-weight: 600;
  color: #1f2937;
}

.music-author, .music-album {
  color: #374151;
}

.music-tags {
  display: flex;
  flex-wrap: wrap;
  gap: 4px;
}

.na-text {
  color: #9ca3af;
  font-style: italic;
}

.table-actions {
  display: flex;
  gap: 8px;
}

:deep(.el-card__header) {
  padding: 20px 24px;
  border-bottom: 1px solid #f0f0f0;
}

:deep(.el-card__body) {
  padding: 24px;
}

:deep(.el-table) {
  border-radius: 8px;
  overflow: hidden;
}

:deep(.el-table th) {
  background: #fafbfc;
  font-weight: 600;
  color: #374151;
}

:deep(.el-table .el-table__cell) {
  border-bottom: 1px solid #f1f3f4;
}
</style>
