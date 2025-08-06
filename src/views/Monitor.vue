<template>
  <div class="monitor-layout">
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
          <h2 class="page-title">监控管理</h2>
          <p class="page-desc">管理您的抖音视频监控任务，实时掌握数据变化</p>
        </div>

        <!-- 操作栏 -->
        <div class="toolbar">
          <div class="toolbar-left">
            <el-button type="primary" @click="showAddDialog = true" :icon="Plus">
              添加监控
            </el-button>
            <el-button @click="loadMonitorVideos" :loading="loading" :icon="Refresh">
              刷新
            </el-button>
          </div>
          <div class="toolbar-right">
            <el-input
              v-model="searchKeyword"
              placeholder="搜索视频ID或链接"
              :prefix-icon="Search"
              style="width: 300px;"
              clearable
            />
          </div>
        </div>

        <!-- 统计卡片 -->
        <div class="stats-row">
          <div class="stat-card total">
            <div class="stat-icon">
              <el-icon size="20"><VideoCamera /></el-icon>
            </div>
            <div class="stat-info">
              <div class="stat-value">{{ filteredMonitors.length }}</div>
              <div class="stat-label">总监控数</div>
            </div>
          </div>
          
          <div class="stat-card active">
            <div class="stat-icon">
              <el-icon size="20"><CircleCheck /></el-icon>
            </div>
            <div class="stat-info">
              <div class="stat-value">{{ activeMonitors.length }}</div>
              <div class="stat-label">启用中</div>
            </div>
          </div>
          
          <div class="stat-card inactive">
            <div class="stat-icon">
              <el-icon size="20"><CircleClose /></el-icon>
            </div>
            <div class="stat-info">
              <div class="stat-value">{{ inactiveMonitors.length }}</div>
              <div class="stat-label">已停用</div>
            </div>
          </div>
        </div>

        <!-- 监控列表 -->
        <el-card class="monitor-table-card">
          <template #header>
            <div class="card-header">
              <span class="card-title">监控列表</span>
              <div class="header-actions">
                <el-tooltip content="批量操作" placement="top">
                  <el-button 
                    :disabled="selectedRows.length === 0"
                    @click="showBatchDialog = true"
                    size="small"
                  >
                    批量操作 ({{ selectedRows.length }})
                  </el-button>
                </el-tooltip>
              </div>
            </div>
          </template>
          
          <div v-loading="loading">
            <el-table 
              :data="filteredMonitors" 
              style="width: 100%"
              @selection-change="handleSelectionChange"
              :empty-text="filteredMonitors.length === 0 ? '暂无监控数据' : ''"
            >
              <el-table-column type="selection" width="55" />
              
              <el-table-column label="视频ID" min-width="120">
                <template #default="{ row }">
                  <div class="video-id">
                    {{ row.monitorVideo?.awemeId || 'N/A' }}
                  </div>
                </template>
              </el-table-column>
              
              <el-table-column label="视频链接" min-width="200">
                <template #default="{ row }">
                  <div class="video-url">
                    <el-link 
                      v-if="row.monitorVideo?.videoUrl"
                      :href="row.monitorVideo.videoUrl" 
                      target="_blank"
                      type="primary"
                    >
                      {{ truncateUrl(row.monitorVideo.videoUrl) }}
                    </el-link>
                    <span v-else class="na-text">N/A</span>
                  </div>
                </template>
              </el-table-column>
              
              <el-table-column label="状态" width="100">
                <template #default="{ row }">
                  <el-tag 
                    :type="getStatusType(row.monitorVideo?.status)"
                    size="small"
                  >
                    {{ getStatusText(row.monitorVideo?.status) }}
                  </el-tag>
                </template>
              </el-table-column>
              
              <el-table-column label="关联音乐" min-width="150">
                <template #default="{ row }">
                  <div v-if="row.musicInfo" class="music-info">
                    <div class="music-title">{{ row.musicInfo.title }}</div>
                    <div class="music-author">{{ row.musicInfo.author }}</div>
                  </div>
                  <span v-else class="na-text">未关联音乐</span>
                </template>
              </el-table-column>
              
              <el-table-column label="最新数据" min-width="150">
                <template #default="{ row }">
                  <div v-if="row.latestStats" class="stats-preview">
                    <div class="stats-item">
                      <el-icon size="14"><Star /></el-icon>
                      <span>{{ formatNumber(row.latestStats.diggCount || 0) }}</span>
                    </div>
                    <div class="stats-item">
                      <el-icon size="14"><ChatDotRound /></el-icon>
                      <span>{{ formatNumber(row.latestStats.commentCount || 0) }}</span>
                    </div>
                  </div>
                  <span v-else class="na-text">暂无数据</span>
                </template>
              </el-table-column>
              
              <el-table-column label="创建时间" width="180">
                <template #default="{ row }">
                  {{ formatDate(row.userMonitor?.createTime) }}
                </template>
              </el-table-column>
              
              <el-table-column label="操作" width="200" fixed="right">
                <template #default="{ row }">
                  <div class="table-actions">
                    <el-tooltip content="查看统计" placement="top">
                      <el-button 
                        type="primary" 
                        size="small" 
                        :icon="DataAnalysis"
                        @click="viewStats(row.monitorVideo?.awemeId)"
                        link
                      />
                    </el-tooltip>
                    
                    <el-tooltip :content="row.monitorVideo?.status === 1 ? '停用监控' : '启用监控'" placement="top">
                      <el-button 
                        :type="row.monitorVideo?.status === 1 ? 'warning' : 'success'"
                        size="small"
                        :icon="row.monitorVideo?.status === 1 ? VideoPause : VideoPlay"
                        @click="toggleStatus(row)"
                        link
                      />
                    </el-tooltip>
                    
                    <el-tooltip content="删除监控" placement="top">
                      <el-button 
                        type="danger" 
                        size="small" 
                        :icon="Delete"
                        @click="deleteMonitor(row)"
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

    <!-- 添加监控对话框 -->
    <el-dialog
      v-model="showAddDialog"
      title="添加监控视频"
      width="500px"
    >

      
      <el-form :model="addForm" label-width="100px">
        <el-form-item label="视频链接">
          <el-input 
            v-model="addForm.videoUrl" 
            placeholder="请输入抖音视频链接或ID"
          />
        </el-form-item>
        
        <el-form-item label="音乐选择">
          <div style="display: flex; gap: 10px; width: 100%;">
            <el-select
              v-model="addForm.musicId"
              placeholder="请选择音乐"
              style="flex: 1"
              filterable
              remote
              :remote-method="searchMusicRemote"
              :loading="musicSearchLoading"
              clearable
              @focus="loadMusicOptions"
            >
              <el-option
                v-for="music in musicOptions"
                :key="music.id"
                :label="`${music.title} - ${music.author}`"
                :value="music.id"
              >
                <div style="display: flex; justify-content: space-between; align-items: center;">
                  <span>{{ music.title }}</span>
                  <span style="color: #8492a6; font-size: 13px;">{{ music.author }}</span>
                </div>
              </el-option>
            </el-select>
            <el-button @click="showMusicDialog = true" :icon="Plus" size="default">
              新建
            </el-button>
          </div>
        </el-form-item>
      </el-form>
      
      <template #footer>
        <el-button @click="showAddDialog = false">取消</el-button>
        <el-button type="primary" @click="handleAddMonitor" :loading="addLoading">
          添加监控
        </el-button>
      </template>
    </el-dialog>

    <!-- 批量操作对话框 -->
    <el-dialog
      v-model="showBatchDialog"
      title="批量操作"
      width="400px"
    >
      <p>已选择 {{ selectedRows.length }} 个监控项</p>
      
      <template #footer>
        <el-button @click="showBatchDialog = false">取消</el-button>
        <el-button type="success" @click="batchToggleStatus(1)">
          批量启用
        </el-button>
        <el-button type="warning" @click="batchToggleStatus(0)">
          批量停用
        </el-button>
        <el-button type="danger" @click="batchDelete">
          批量删除
        </el-button>
      </template>
    </el-dialog>

    <!-- 快速添加音乐对话框 -->
    <el-dialog
      v-model="showMusicDialog"
      title="快速添加音乐"
      width="500px"
    >
      <el-form :model="quickMusicForm" label-width="100px">
        <el-form-item label="音乐标题" required>
          <el-input 
            v-model="quickMusicForm.title" 
            placeholder="请输入音乐标题"
          />
        </el-form-item>
        
        <el-form-item label="作者" required>
          <el-input 
            v-model="quickMusicForm.author" 
            placeholder="请输入作者名称"
          />
        </el-form-item>
        
        <el-form-item label="专辑">
          <el-input 
            v-model="quickMusicForm.album" 
            placeholder="请输入专辑名称"
          />
        </el-form-item>
        
        <el-form-item label="标签">
          <el-input 
            v-model="quickMusicForm.tagList" 
            placeholder="请输入标签，用逗号分隔（如：流行,抒情）"
          />
        </el-form-item>
      </el-form>
      
      <template #footer>
        <el-button @click="showMusicDialog = false">取消</el-button>
        <el-button type="primary" @click="handleQuickAddMusic">
          添加音乐
        </el-button>
      </template>
    </el-dialog>
  </div>
</template>

<script setup>
import { ref, computed, onMounted } from 'vue'
import { useRouter } from 'vue-router'
import { useAuthStore } from '@/store/auth'
import { monitorApi } from '@/api/monitor'
import { musicApi } from '@/api/music'
import { videoApi } from '@/api/video'
import { ElMessage, ElMessageBox } from 'element-plus'
import {
  Plus,
  Refresh,
  Search,
  DataAnalysis,
  VideoPause,
  VideoPlay,
  Delete,
  VideoCamera,
  CircleCheck,
  CircleClose,
  Star,
  ChatDotRound,
  Odometer,
  View,
  Headset,
  ArrowDown
} from '@element-plus/icons-vue'

const router = useRouter()
const authStore = useAuthStore()

const loading = ref(false)
const addLoading = ref(false)
const musicSearchLoading = ref(false)
const monitorList = ref([])
const searchKeyword = ref('')
const selectedRows = ref([])
const musicOptions = ref([])

const showAddDialog = ref(false)
const showBatchDialog = ref(false)
const showMusicDialog = ref(false)
const addForm = ref({
  videoUrl: '',
  musicId: null
})

const quickMusicForm = ref({
  title: '',
  author: '',
  album: '',
  tagList: ''
})

const filteredMonitors = computed(() => {
  if (!searchKeyword.value) return monitorList.value
  
  return monitorList.value.filter(item => {
    const awemeId = item.monitorVideo?.awemeId?.toString() || ''
    const videoUrl = item.monitorVideo?.videoUrl || ''
    const keyword = searchKeyword.value.toLowerCase()
    
    return awemeId.toLowerCase().includes(keyword) || 
           videoUrl.toLowerCase().includes(keyword)
  })
})

const activeMonitors = computed(() => {
  return filteredMonitors.value.filter(item => item.monitorVideo?.status === 1)
})

const inactiveMonitors = computed(() => {
  return filteredMonitors.value.filter(item => item.monitorVideo?.status !== 1)
})

const formatNumber = (num) => {
  if (!num) return '0'
  if (num >= 10000) {
    return (num / 10000).toFixed(1) + 'w'
  }
  return num.toString()
}

const formatDate = (dateStr) => {
  if (!dateStr) return 'N/A'
  return new Date(dateStr).toLocaleString('zh-CN')
}

const truncateUrl = (url) => {
  if (!url) return ''
  if (url.length <= 50) return url
  return url.substring(0, 47) + '...'
}

// 根据API文档定义的状态码获取状态类型
const getStatusType = (status) => {
  switch (status) {
    case 1: return 'success'  // 启用状态，正常监控
    case 0: return 'info'     // 停用状态，暂停监控
    case 2: return 'warning'  // 已删除或无权限，视频不可访问
    case 3: return 'danger'   // 其他失败，爬取遇到其他错误
    default: return 'info'
  }
}

// 根据API文档定义的状态码获取状态文本
const getStatusText = (status) => {
  switch (status) {
    case 1: return '启用'
    case 0: return '停用'
    case 2: return '无权限'
    case 3: return '失败'
    default: return '未知'
  }
}

const loadMonitorVideos = async () => {
  loading.value = true
  try {
    // 首先获取基础监控列表
    const response = await monitorApi.getMonitorList()
    console.log('Monitor页面: 监控列表API响应:', response)
    
    if (response.code === 200) {
      const data = response.data || []
      console.log('Monitor页面: 处理后的监控数据:', data)
      
      // 检查数据结构并记录
      if (data.length > 0) {
        console.log('Monitor页面: 第一条数据结构:', JSON.stringify(data[0], null, 2))
      }
      
      // 尝试获取详细信息（包含音乐信息和最新统计数据）
      try {
        const detailResponse = await videoApi.getMonitorVideoDetails()
        console.log('Monitor页面: 详细信息API响应:', detailResponse)
        
        if (detailResponse.code === 200) {
          const detailData = detailResponse.data || []
          console.log('Monitor页面: 详细信息数据:', detailData)
          
          // 合并基础数据和详细数据
          const mergedData = await Promise.all(data.map(async item => {
            const detail = detailData.find(d => 
              d.monitor?.awemeId === item.monitorVideo?.awemeId ||
              d.monitorVideo?.awemeId === item.monitorVideo?.awemeId
            )
            
            let musicInfo = detail?.music || detail?.musicInfo
            
            // 如果详细信息中没有音乐信息，但有musicId，尝试获取音乐信息
            if (!musicInfo && (item.userMonitor?.musicId || item.monitorVideo?.musicId)) {
              try {
                const musicId = item.userMonitor?.musicId || item.monitorVideo?.musicId
                const musicResponse = await musicApi.getMusicById(musicId)
                if (musicResponse.code === 200) {
                  musicInfo = musicResponse.data
                }
              } catch (musicError) {
                console.warn('获取音乐信息失败:', musicError)
              }
            }
            
            return {
              ...item,
              musicInfo,
              latestStats: detail?.latestStats || detail?.video?.latestStats,
              video: detail?.video
            }
          }))
          
          console.log('Monitor页面: 合并后的数据:', mergedData)
          monitorList.value = mergedData
        } else {
          // 如果获取详细信息失败，尝试单独获取音乐信息和统计数据
          const enhancedData = await Promise.all(data.map(async item => {
            let musicInfo = null
            let latestStats = null
            
            // 尝试获取音乐信息
            if (item.userMonitor?.musicId || item.monitorVideo?.musicId) {
              try {
                const musicId = item.userMonitor?.musicId || item.monitorVideo?.musicId
                const musicResponse = await musicApi.getMusicById(musicId)
                if (musicResponse.code === 200) {
                  musicInfo = musicResponse.data
                }
              } catch (musicError) {
                console.warn('获取音乐信息失败:', musicError)
              }
            }
            
            // 尝试获取最新统计数据
            if (item.monitorVideo?.awemeId) {
              try {
                const statsResponse = await videoApi.getLatestVideoStats(item.monitorVideo.awemeId)
                if (statsResponse.code === 200) {
                  latestStats = statsResponse.data
                }
              } catch (statsError) {
                console.warn('获取统计数据失败:', statsError)
              }
            }
            
            return {
              ...item,
              musicInfo,
              latestStats
            }
          }))
          
          monitorList.value = enhancedData
        }
      } catch (detailError) {
        console.warn('Monitor页面: 获取详细信息失败，使用基础数据:', detailError)
        monitorList.value = data
      }
    } else {
      ElMessage.error(response.message || '加载监控列表失败')
    }
  } catch (error) {
    console.error('Monitor页面: 加载监控列表失败:', error)
    ElMessage.error('加载监控列表失败')
  } finally {
    loading.value = false
  }
}

const handleAddMonitor = async () => {
  if (!addForm.value.videoUrl.trim()) {
    ElMessage.warning('请输入视频链接或ID')
    return
  }
  
  addLoading.value = true
  try {
    const response = await monitorApi.addMonitor({
      videoUrl: addForm.value.videoUrl.trim(),
      musicId: addForm.value.musicId || null
    })
    
    if (response.code === 200) {
      ElMessage.success('添加监控成功')
      showAddDialog.value = false
      addForm.value = {
        videoUrl: '',
        musicId: null
      }
      await loadMonitorVideos()
    } else {
      ElMessage.error(response.message || '添加监控失败')
    }
  } catch (error) {
    ElMessage.error('添加监控失败')
  } finally {
    addLoading.value = false
  }
}

const loadMusicOptions = async () => {
  if (musicOptions.value.length > 0) return
  
  try {
    const response = await musicApi.getMusicList()
    if (response.code === 200) {
      musicOptions.value = response.data || []
    }
  } catch (error) {
    console.error('加载音乐列表失败:', error)
  }
}

const searchMusicRemote = async (query) => {
  if (!query) {
    await loadMusicOptions()
    return
  }
  
  musicSearchLoading.value = true
  try {
    const response = await musicApi.searchMusic(query)
    if (response.code === 200) {
      musicOptions.value = response.data || []
    }
  } catch (error) {
    console.error('搜索音乐失败:', error)
  } finally {
    musicSearchLoading.value = false
  }
}

const handleQuickAddMusic = async () => {
  if (!quickMusicForm.value.title.trim() || !quickMusicForm.value.author.trim()) {
    ElMessage.warning('请输入音乐标题和作者')
    return
  }
  
  try {
    const response = await musicApi.addMusic(quickMusicForm.value)
    if (response.code === 200) {
      ElMessage.success('添加音乐成功')
      showMusicDialog.value = false
      quickMusicForm.value = {
        title: '',
        author: '',
        album: '',
        tagList: ''
      }
      await loadMusicOptions()
    } else {
      ElMessage.error(response.message || '添加音乐失败')
    }
  } catch (error) {
    console.error('添加音乐失败:', error)
    ElMessage.error('添加音乐失败')
  }
}

const viewStats = (awemeId) => {
  if (awemeId) {
    router.push(`/stats/${awemeId}`)
  } else {
    ElMessage.warning('视频ID无效')
  }
}

const toggleStatus = async (row) => {
  const newStatus = row.monitorVideo?.status === 1 ? 0 : 1
  const action = newStatus === 1 ? '启用' : '停用'
  
  try {
    await ElMessageBox.confirm(`确认${action}该监控视频？`, '提示', {
      type: 'warning'
    })
    
    const response = await monitorApi.updateStatus(row.monitorVideo.id, { status: newStatus })
    if (response.code === 200) {
      await loadMonitorVideos()
      ElMessage.success(`${action}成功`)
    } else {
      ElMessage.error(response.message || `${action}失败`)
    }
  } catch (error) {
    if (error !== 'cancel') {
      ElMessage.error(`${action}失败`)
    }
  }
}

const deleteMonitor = async (row) => {
  try {
    await ElMessageBox.confirm('确认删除该监控视频？删除后无法恢复', '警告', {
      type: 'warning',
      confirmButtonText: '确认删除',
      cancelButtonText: '取消'
    })
    
    const response = await monitorApi.deleteMonitor(row.monitorVideo.id)
    if (response.code === 200) {
      await loadMonitorVideos()
      ElMessage.success('删除成功')
    } else {
      ElMessage.error(response.message || '删除失败')
    }
  } catch (error) {
    if (error !== 'cancel') {
      ElMessage.error('删除失败')
    }
  }
}

const handleSelectionChange = (selection) => {
  selectedRows.value = selection
}

const batchToggleStatus = async (status) => {
  const action = status === 1 ? '启用' : '停用'
  
  try {
    await ElMessageBox.confirm(`确认批量${action}选中的 ${selectedRows.value.length} 个监控项？`, '提示', {
      type: 'warning'
    })
    
    const promises = selectedRows.value.map(row => 
      monitorApi.updateStatus(row.monitorVideo.id, { status })
    )
    
    await Promise.all(promises)
    await loadMonitorVideos()
    showBatchDialog.value = false
    selectedRows.value = []
    ElMessage.success(`批量${action}成功`)
  } catch (error) {
    if (error !== 'cancel') {
      ElMessage.error(`批量${action}失败`)
    }
  }
}

const batchDelete = async () => {
  try {
    await ElMessageBox.confirm(`确认批量删除选中的 ${selectedRows.value.length} 个监控项？删除后无法恢复`, '警告', {
      type: 'warning',
      confirmButtonText: '确认删除',
      cancelButtonText: '取消'
    })
    
    const promises = selectedRows.value.map(row => 
      monitorApi.deleteMonitor(row.monitorVideo.id)
    )
    
    await Promise.all(promises)
    await loadMonitorVideos()
    showBatchDialog.value = false
    selectedRows.value = []
    ElMessage.success('批量删除成功')
  } catch (error) {
    if (error !== 'cancel') {
      ElMessage.error('批量删除失败')
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
  loadMonitorVideos()
})
</script>

<style scoped>
.monitor-layout {
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

.stat-card.active .stat-icon {
  background: linear-gradient(135deg, #4facfe 0%, #00f2fe 100%);
  color: white;
}

.stat-card.inactive .stat-icon {
  background: linear-gradient(135deg, #fa709a 0%, #fee140 100%);
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

.monitor-table-card {
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

.video-id {
  font-family: 'Consolas', 'Monaco', monospace;
  font-weight: 600;
  color: #374151;
}

.video-url {
  max-width: 200px;
  overflow: hidden;
}

.na-text {
  color: #9ca3af;
  font-style: italic;
}

.stats-preview {
  display: flex;
  gap: 12px;
  align-items: center;
}

.stats-item {
  display: flex;
  align-items: center;
  gap: 4px;
  font-size: 12px;
  color: #6b7280;
}

.music-info {
  display: flex;
  flex-direction: column;
  gap: 2px;
}

.music-title {
  font-weight: 600;
  font-size: 13px;
  color: #374151;
}

.music-author {
  font-size: 12px;
  color: #6b7280;
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