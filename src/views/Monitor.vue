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
                <el-dropdown-item command="updateEmail">更新邮箱</el-dropdown-item>
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
          <el-menu-item index="/music" class="menu-item">
            <el-icon><Headset /></el-icon>
            <span>音乐管理</span>
          </el-menu-item>
        </el-menu>
      </nav>

      <!-- 主内容区 -->
      <main class="content">
        <div class="page-header">
          <template v-if="currentMusicId && currentMusicInfo">
            <h2 class="page-title">
              {{ currentMusicInfo.title }}
              <span class="music-meta"> · {{ currentMusicInfo.author }}</span>
            </h2>
            <p class="page-meta">
              <span>专辑：{{ currentMusicInfo.album || '-' }}</span>
              <span v-if="currentMusicInfo.tagList"> · 标签：{{ currentMusicInfo.tagList }}</span>
            </p>
          </template>
          <template v-else>
            <h2 class="page-title">监控管理</h2>
            <p class="page-desc">管理您的抖音视频监控任务，实时掌握数据变化</p>
          </template>
        </div>

        <!-- 统计卡片 -->
        <div class="stats-row">
          <div 
            class="stat-card total"
            :class="{ 'is-active': currentFilter === 'all' }"
            @click="filterVideos('all')"
          >
            <div class="stat-icon">
              <el-icon size="20"><VideoCamera /></el-icon>
            </div>
            <div class="stat-info">
              <div class="stat-value">{{ allMonitors.length }}</div>
              <div class="stat-label">监控视频总数</div>
            </div>
          </div>
          
          <div 
            class="stat-card monitoring"
            :class="{ 'is-active': currentFilter === 'monitoring' }"
            @click="filterVideos('monitoring')"
          >
            <div class="stat-icon">
              <el-icon size="20"><CircleCheck /></el-icon>
            </div>
            <div class="stat-info">
              <div class="stat-value">{{ activeMonitors.length }}</div>
              <div class="stat-label">监控中</div>
            </div>
          </div>
          
          <div 
            class="stat-card error"
            :class="{ 'is-active': currentFilter === 'error' }"
            @click="filterVideos('error')"
          >
            <div class="stat-icon">
              <el-icon size="20"><Warning /></el-icon>
            </div>
            <div class="stat-info">
              <div class="stat-value">{{ abnormalMonitors.length }}</div>
              <div class="stat-label">异常监控</div>
            </div>
          </div>
          
          <div 
            class="stat-card auto"
            :class="{ 'is-active': currentFilter === 'auto' }"
            @click="filterVideos('auto')"
          >
            <div class="stat-icon">
              <el-icon size="20"><MagicStick /></el-icon>
            </div>
            <div class="stat-info">
              <div class="stat-value">{{ autoMonitors.length }}</div>
              <div class="stat-label">自动添加</div>
            </div>
          </div>
        </div>

        <!-- 操作栏（已与统计卡片交换位置） -->
        <div class="section-divider"></div>
        <div class="toolbar">
          <div class="toolbar-left">
            <el-button v-if="currentMusicId" @click="goBackFromMusic" :icon="ArrowLeft">
              返回
            </el-button>
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
              placeholder="搜索视频ID、链接或播主名称"
              :prefix-icon="Search"
              style="width: 300px;"
              clearable
            />
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
              size="default"
              :cell-style="{ padding: '6px 6px' }"
              :header-cell-style="{ padding: '8px 6px', background: '#fafafa' }"
            >
              <el-table-column type="selection" width="50" />
              
              <el-table-column label="视频ID" width="140">
                <template #default="{ row }">
                  <div class="video-id">
                    {{ row.monitorVideo?.awemeId || 'N/A' }}
                  </div>
                </template>
              </el-table-column>
              
              <el-table-column label="视频链接" width="280">
                <template #default="{ row }">
                  <div class="video-url-wrap">
                    <el-link 
                      v-if="row.monitorVideo?.videoUrl"
                      :href="row.monitorVideo.videoUrl" 
                      target="_blank"
                      type="primary"
                      class="video-link"
                    >
                      {{ row.monitorVideo.videoUrl }}
                    </el-link>
                    <span v-else class="na-text">N/A</span>
                  </div>
                </template>
              </el-table-column>
              
              <el-table-column label="播主名称" width="140">
                <template #default="{ row }">
                  <div class="author-name">
                    <el-link 
                      type="primary" 
                      class="author-nickname"
                      @click.stop="goToAuthor(row)"
                    >
                      {{ row.authorInfo?.nickname || row.videoInfo?.authorId || 'N/A' }}
                    </el-link>
                    <el-tag
                      v-if="row.authorInfo?.followerCount"
                      size="small"
                      type="info"
                      class="author-followers-tag"
                    >
                      粉丝 {{ formatFollowerCount(row.authorInfo.followerCount) }}
                    </el-tag>
                  </div>
                </template>
              </el-table-column>
              
              <el-table-column label="状态" width="100" align="center">
                <template #default="{ row }">
                  <el-tag 
                    :type="getStatusType(row.monitorVideo?.status)"
                    size="small"
                    class="status-tag"
                  >
                    {{ getStatusText(row.monitorVideo?.status) }}
                  </el-tag>
                </template>
              </el-table-column>
              
              <el-table-column label="关联音乐" width="130">
                <template #default="{ row }">
                  <div v-if="row.musicInfo" class="music-info">
                    <div class="music-title">{{ row.musicInfo.title }}</div>
                    <div class="music-author">{{ row.musicInfo.author }}</div>
                  </div>
                  <span v-else class="na-text">未关联音乐</span>
                </template>
              </el-table-column>
              
              <el-table-column label="最新数据" width="140">
                <template #default="{ row }">
                  <div v-if="row.latestStats" class="stats-preview">
                    <div class="stats-item">
                      <div class="heart-icon">
                        <svg width="14" height="14" viewBox="0 0 24 24" fill="currentColor">
                          <path d="M12 21.35l-1.45-1.32C5.4 15.36 2 12.28 2 8.5 2 5.42 4.42 3 7.5 3c1.74 0 3.41.81 4.5 2.09C13.09 3.81 14.76 3 16.5 3 19.58 3 22 5.42 22 8.5c0 3.78-3.4 6.86-8.55 11.54L12 21.35z"/>
                        </svg>
                      </div>
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
              
              <el-table-column label="发布时间" width="160" align="center">
                <template #default="{ row }">
                  <div class="publish-time">
                    {{ formatPublishTime(row.monitorVideo?.videoPublishTime) }}
                  </div>
                </template>
              </el-table-column>
              
              <el-table-column label="操作" width="160" fixed="right">
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
                      >
                        {{ row.monitorVideo?.status === 1 ? '停用' : '启用' }}
                      </el-button>
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
      width="600px"
    >
      <!-- 添加方式选择 -->
      <el-radio-group v-model="addMode" style="margin-bottom: 20px;" @change="resetAddForm">
        <el-radio-button label="single">单个添加</el-radio-button>
        <el-radio-button label="batch">批量导入</el-radio-button>
      </el-radio-group>

      <el-form :model="addForm" label-width="100px">
        <!-- 单个添加模式 -->
        <template v-if="addMode === 'single'">
          <el-form-item label="视频链接">
            <el-input 
              v-model="addForm.videoUrl" 
              placeholder="请输入抖音视频链接或ID"
            />
          </el-form-item>
        </template>

        <!-- 批量导入模式 -->
        <template v-else>
          <el-alert
            title="批量导入说明"
            type="info"
            :closable="false"
            show-icon
            style="margin-bottom: 20px;"
          >
            <template #default>
              <div style="line-height: 1.6;">
                <p><strong>Excel文件格式要求：</strong></p>
                <ul style="margin: 8px 0; padding-left: 20px;">
                  <li>支持 .xlsx、.xls 和 .csv 格式</li>
                  <li>第一行为标题行（监控视频地址），会被跳过</li>
                  <li>从第二行开始，第一列为视频链接</li>
                </ul>
                <p style="margin: 8px 0;">
                  <el-button 
                    type="primary" 
                    size="small" 
                    @click="downloadTemplate"
                    :icon="Download"
                  >
                    下载Excel模板
                  </el-button>
                </p>
              </div>
            </template>
          </el-alert>

          <el-form-item label="Excel文件" required>
            <el-upload
              ref="uploadRef"
              :auto-upload="false"
              :show-file-list="true"
              :limit="1"
              accept=".xlsx,.xls,.csv"
              :on-change="handleFileChange"
              :on-remove="handleFileRemove"
            >
              <el-button :icon="Upload">选择Excel文件</el-button>
              <template #tip>
                <div class="el-upload__tip" style="color: #909399; font-size: 12px; margin-top: 5px;">
                  支持 .xlsx/.xls/.csv 文件，且不超过 10MB
                </div>
              </template>
            </el-upload>
          </el-form-item>
        </template>
        
        <el-form-item label="音乐选择" required>
          <div style="display: flex; gap: 10px; width: 100%;">
            <el-select
              v-model="addForm.musicId"
              placeholder="请选择音乐（必填）"
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
        <el-button 
          type="primary" 
          @click="addMode === 'single' ? handleAddMonitor() : handleExcelUpload()" 
          :loading="addMode === 'single' ? addLoading : excelUploading"
          :disabled="addMode === 'batch' && (!addForm.musicId || !addForm.file)"
        >
          {{ addMode === 'single' ? '添加监控' : '开始导入' }}
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

    <!-- 任务进度对话框 -->
    <el-dialog
      v-model="showTaskProgressDialog"
      title="导入进度"
      width="500px"
      :close-on-click-modal="false"
      :close-on-press-escape="false"
      @close="closeTaskProgressDialog"
    >
      <div class="task-progress-container">
        <div class="task-info">
          <p><strong>文件名：</strong>{{ currentTask.fileName }}</p>
          <p><strong>任务ID：</strong>{{ currentTask.id }}</p>
          <p>
            <strong>状态：</strong>
            <el-tag :type="getTaskStatusType(currentTask.status)" size="small">
              {{ getTaskStatusText(currentTask.status) }}
            </el-tag>
          </p>
        </div>

        <div class="progress-section">
          <el-progress 
            :percentage="currentTask.progress" 
            :status="currentTask.status === 'COMPLETED' ? 'success' : (currentTask.status === 'FAILED' ? 'exception' : null)"
          />
          
          <div class="progress-stats" v-if="currentTask.totalCount > 0">
            <div class="task-stats-row">
              <span>总计：{{ currentTask.totalCount }}</span>
              <span>已处理：{{ currentTask.processedCount }}</span>
            </div>
            <div class="task-stats-row">
              <span style="color: #67c23a;">成功：{{ currentTask.successCount }}</span>
              <span style="color: #909399;">跳过：{{ currentTask.skipCount }}</span>
              <span style="color: #f56c6c;">失败：{{ currentTask.errorCount }}</span>
            </div>
          </div>
        </div>

        <div v-if="currentTask.status === 'PROCESSING'" class="processing-tip">
          <el-icon class="rotating"><Loading /></el-icon>
          <span>正在处理中，请稍候...</span>
        </div>

        <div v-if="currentTask.status === 'COMPLETED'" class="completed-message">
          <el-icon style="color: #67c23a;"><CircleCheck /></el-icon>
          <span>导入完成！</span>
        </div>

        <div v-if="currentTask.status === 'FAILED'" class="failed-message">
          <el-icon style="color: #f56c6c;"><CircleClose /></el-icon>
          <span>导入失败，请重试</span>
        </div>
      </div>

      <template #footer>
        <el-button 
          @click="closeTaskProgressDialog"
          :disabled="currentTask.status === 'PROCESSING'"
        >
          {{ currentTask.status === 'PROCESSING' ? '处理中...' : '关闭' }}
        </el-button>
      </template>
    </el-dialog>

    <!-- 更新邮箱对话框 -->
    <el-dialog
      v-model="showUpdateEmailDialog"
      title="更新邮箱"
      width="420px"
    >
      <el-form :model="emailForm" label-width="80px">
        <el-form-item label="邮箱">
          <el-input v-model="emailForm.email" placeholder="请输入新的邮箱地址" />
        </el-form-item>
      </el-form>
      <template #footer>
        <el-button @click="showUpdateEmailDialog = false">取消</el-button>
        <el-button type="primary" :loading="updateEmailLoading" @click="submitUpdateEmail">确定</el-button>
      </template>
    </el-dialog>

  </div>
</template>

<script setup>
import { ref, computed, onMounted, onUnmounted } from 'vue'
import { useRouter, useRoute } from 'vue-router'
import { useAuthStore } from '@/store/auth'
import { monitorApi } from '@/api/monitor'
import { musicApi } from '@/api/music'
import { videoApi } from '@/api/video'
import { authorApi } from '@/api/author'
import { authApi } from '@/api/auth'
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
  ChatDotRound,
  Download,
  Loading,
  Odometer,
  View,
  Headset,
  ArrowDown,
  ArrowLeft,
  Upload,
  Collection,
  Close,
  Warning,
  MagicStick
} from '@element-plus/icons-vue'

const route = useRoute()
const router = useRouter()
const authStore = useAuthStore()

const loading = ref(false)
const addLoading = ref(false)
const musicSearchLoading = ref(false)
const monitorList = ref([])
const searchKeyword = ref('')
const selectedRows = ref([])
const musicOptions = ref([])
const currentMusicId = ref(null) // 当前过滤的音乐ID
const currentMusicInfo = ref(null)

const showAddDialog = ref(false)
const showBatchDialog = ref(false)
const showMusicDialog = ref(false)
const showTaskProgressDialog = ref(false)
const excelUploading = ref(false)
const addMode = ref('single') // 'single' 或 'batch'
const addForm = ref({
  videoUrl: '',
  musicId: null,
  file: null
})

const quickMusicForm = ref({
  title: '',
  author: '',
  album: '',
  tagList: ''
})

// 任务进度相关数据
const currentTask = ref({
  id: null,
  fileName: '',
  status: 'PENDING',
  progress: 0,
  totalCount: 0,
  processedCount: 0,
  successCount: 0,
  skipCount: 0,
  errorCount: 0
})

const taskProgressTimer = ref(null)

// 更新邮箱对话框
const showUpdateEmailDialog = ref(false)
const updateEmailLoading = ref(false)
const emailForm = ref({ email: '' })

const filteredMonitors = computed(() => {
  let filtered = monitorList.value
  
  // 根据当前过滤器选择监控视频
  switch (currentFilter.value) {
    case 'all':
      filtered = monitorList.value
      break
    case 'monitoring':
      filtered = monitorList.value.filter(item => item.monitorVideo?.status === 1)
      break
    case 'error':
      filtered = monitorList.value.filter(item => {
        const status = item.monitorVideo?.status
        return status !== 0 && status !== 1
      })
      break
    case 'auto':
      filtered = monitorList.value.filter(item => item.monitorVideo?.type === 0)
      break
    default:
      filtered = monitorList.value
  }
  
  // 如果有音乐ID过滤条件
  if (currentMusicId.value) {
    filtered = filtered.filter(item => {
      const itemMusicId = item.userMonitor?.musicId || item.monitorVideo?.musicId
      return itemMusicId === currentMusicId.value
    })
  }
  
  // 如果有搜索关键词
  if (searchKeyword.value) {
    const keyword = searchKeyword.value.toLowerCase()
    filtered = filtered.filter(item => {
      const awemeId = item.monitorVideo?.awemeId?.toString() || ''
      const videoUrl = item.monitorVideo?.videoUrl || ''
      const authorNickname = item.authorInfo?.nickname || ''
      const authorId = item.videoInfo?.authorId || ''
      
      return awemeId.toLowerCase().includes(keyword) || 
             videoUrl.toLowerCase().includes(keyword) ||
             authorNickname.toLowerCase().includes(keyword) ||
             authorId.toLowerCase().includes(keyword)
    })
  }
  
  return filtered
})

const activeMonitors = computed(() => {
  // status=1是正常监控中
  return monitorList.value.filter(item => item.monitorVideo?.status === 1)
})

const inactiveMonitors = computed(() => {
  // status=0是已停用
  return monitorList.value.filter(item => item.monitorVideo?.status === 0)
})

const abnormalMonitors = computed(() => {
  // status=2,3等是监控异常
  return monitorList.value.filter(item => {
    const status = item.monitorVideo?.status
    return status !== 0 && status !== 1
  })
})

const allMonitors = computed(() => {
  return monitorList.value
})

const autoMonitors = computed(() => {
  // type=0是自动添加
  return monitorList.value.filter(item => item.monitorVideo?.type === 0)
})

const currentFilter = ref('all')

const filterVideos = (filterType) => {
  currentFilter.value = filterType
  
  const filterMessages = {
    'all': '已显示所有监控视频',
    'monitoring': '已过滤显示监控中的视频',
    'error': '已过滤显示异常监控的视频',
    'auto': '已过滤显示自动添加的视频'
  }
  
  ElMessage.success(filterMessages[filterType] || '过滤完成')
}

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

const formatPublishTime = (timestamp) => {
  if (!timestamp) return 'N/A'
  // videoPublishTime是秒级时间戳，需要转换为毫秒
  const date = new Date(timestamp * 1000)
  return date.toLocaleString('zh-CN')
}

const formatFollowerCount = (count) => {
  if (!count) return '0'
  if (count >= 10000) {
    return (count / 10000).toFixed(1) + 'w'
  }
  return count.toString()
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
            let videoInfo = detail?.video
            let authorInfo = null
            
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
            
            // 如果没有视频详细信息，尝试获取视频信息
            if (!videoInfo && item.monitorVideo?.awemeId) {
              try {
                const videoResponse = await videoApi.getVideoInfo(item.monitorVideo.awemeId)
                if (videoResponse.code === 200) {
                  videoInfo = videoResponse.data
                }
              } catch (videoError) {
                console.warn('获取视频信息失败:', videoError)
              }
            }
            
            // 如果有视频信息且包含authorId，尝试获取播主信息
            if (videoInfo?.authorId) {
              try {
                const authorResponse = await authorApi.getAuthorInfo(videoInfo.authorId)
                if (authorResponse.code === 200) {
                  authorInfo = authorResponse.data
                }
              } catch (authorError) {
                console.warn('获取播主信息失败:', authorError)
              }
            }
            
            return {
              ...item,
              musicInfo,
              videoInfo,
              authorInfo,
              latestStats: detail?.latestStats || detail?.video?.latestStats,
              video: detail?.video
            }
          }))
          
          console.log('Monitor页面: 合并后的数据:', mergedData)
          monitorList.value = mergedData
        } else {
          // 如果获取详细信息失败，尝试单独获取音乐信息、视频信息、播主信息和统计数据
          const enhancedData = await Promise.all(data.map(async item => {
            let musicInfo = null
            let videoInfo = null
            let authorInfo = null
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
            
            // 尝试获取视频信息
            if (item.monitorVideo?.awemeId) {
              try {
                const videoResponse = await videoApi.getVideoInfo(item.monitorVideo.awemeId)
                if (videoResponse.code === 200) {
                  videoInfo = videoResponse.data
                }
              } catch (videoError) {
                console.warn('获取视频信息失败:', videoError)
              }
            }
            
            // 如果有视频信息且包含authorId，尝试获取播主信息
            if (videoInfo?.authorId) {
              try {
                const authorResponse = await authorApi.getAuthorInfo(videoInfo.authorId)
                if (authorResponse.code === 200) {
                  authorInfo = authorResponse.data
                }
              } catch (authorError) {
                console.warn('获取播主信息失败:', authorError)
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
              videoInfo,
              authorInfo,
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
  
  // 根据API文档，音乐ID是必选项
  if (!addForm.value.musicId) {
    ElMessage.warning('请选择音乐，音乐为必选项')
    return
  }
  
  addLoading.value = true
  try {
    const response = await monitorApi.addMonitor({
      videoUrl: addForm.value.videoUrl.trim(),
      musicId: addForm.value.musicId
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
      // 根据API文档的具体错误信息进行处理
      if (response.message?.includes('音乐ID不能为空，音乐为必选项')) {
        ElMessage.error('音乐为必选项，请选择一个音乐')
      } else if (response.message?.includes('指定的音乐不存在，请选择有效的音乐')) {
        ElMessage.error('所选音乐不存在，请重新选择')
      } else if (response.message?.includes('视频链接不能为空')) {
        ElMessage.error('请输入视频链接')
      } else if (response.message?.includes('添加失败，可能是链接格式错误或已存在')) {
        ElMessage.error('视频链接格式错误或该视频已在监控中')
      } else {
        ElMessage.error(response.message || '添加监控失败')
      }
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

// 重置添加表单
const resetAddForm = () => {
  addForm.value = {
    videoUrl: '',
    musicId: null,
    file: null
  }
  // 清理上传组件
  if (uploadRef.value) {
    try {
      uploadRef.value.clearFiles()
    } catch (error) {
      console.warn('清理上传组件失败:', error)
    }
  }
}

// 下载Excel模板
const downloadTemplate = () => {
  const link = document.createElement('a')
  link.href = '/监控视频模板.xlsx'
  link.download = '监控视频模板.xlsx'
  document.body.appendChild(link)
  link.click()
  document.body.removeChild(link)
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

// Excel文件处理函数
const uploadRef = ref()

const handleFileChange = (file) => {
  console.log('文件选择:', file)
  
  // 检查文件类型
  const allowedTypes = [
    'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet', // .xlsx
    'application/vnd.ms-excel', // .xls
    'text/csv', // .csv
    'application/csv' // .csv (alternative MIME type)
  ]
  
  if (!allowedTypes.includes(file.raw.type) && !file.name.endsWith('.csv')) {
    ElMessage.error('请选择 .xlsx、.xls 或 .csv 格式的文件')
    try {
      uploadRef.value?.clearFiles()
    } catch (error) {
      console.warn('清理上传文件失败:', error)
    }
    addForm.value.file = null
    return
  }
  
  // 检查文件大小（10MB）
  const maxSize = 10 * 1024 * 1024
  if (file.raw.size > maxSize) {
    ElMessage.error('文件大小不能超过 10MB')
    try {
      uploadRef.value?.clearFiles()
    } catch (error) {
      console.warn('清理上传文件失败:', error)
    }
    addForm.value.file = null
    return
  }
  
  addForm.value.file = file.raw
}

const handleFileRemove = () => {
  console.log('文件移除')
  addForm.value.file = null
}

const handleExcelUpload = async () => {
  if (!addForm.value.musicId) {
    ElMessage.warning('请选择音乐，音乐为必选项')
    return
  }
  
  if (!addForm.value.file) {
    ElMessage.warning('请选择要上传的Excel文件')
    return
  }

  // 额外验证文件对象的完整性
  if (!addForm.value.file.name) {
    ElMessage.error('文件信息不完整，请重新选择文件')
    addForm.value.file = null
    return
  }
  
  excelUploading.value = true
  
  try {
    // 创建FormData对象
    const formData = new FormData()
    formData.append('file', addForm.value.file)
    formData.append('musicId', addForm.value.musicId.toString())
    
    console.log('开始上传Excel文件:', {
      fileName: addForm.value.file.name,
      fileSize: addForm.value.file.size,
      musicId: addForm.value.musicId
    })
    
    const response = await monitorApi.uploadExcelAsync(formData)
    
    if (response.code === 200) {
      const { taskId, message } = response.data
      
      ElMessage.success('文件上传成功，正在后台处理中...')
      
      // 保存文件名，因为resetAddForm会清空file
      const fileName = addForm.value.file?.name || '未知文件'
      
      // 关闭对话框并重置表单
      showAddDialog.value = false
      resetAddForm()
      
      // 显示任务进度对话框
      openTaskProgressDialog(taskId, fileName)
      
    } else {
      // 处理各种错误情况
      let errorMessage = response.message || 'Excel上传失败'
      
      if (response.message?.includes('请选择要上传的Excel文件')) {
        errorMessage = '请选择要上传的Excel文件'
      } else if (response.message?.includes('文件格式不正确，请上传Excel文件(.xlsx或.xls)')) {
        errorMessage = '文件格式不正确，请上传Excel文件(.xlsx或.xls)'
      } else if (response.message?.includes('音乐ID不能为空，音乐为必选项')) {
        errorMessage = '音乐为必选项，请选择音乐'
      } else if (response.message?.includes('指定的音乐不存在，请选择有效的音乐')) {
        errorMessage = '所选音乐不存在，请重新选择音乐'
      }
      
      ElMessage.error(errorMessage)
    }
    
  } catch (error) {
    console.error('Excel上传失败:', error)
    ElMessage.error('Excel上传失败，请检查网络连接后重试')
  } finally {
    excelUploading.value = false
  }
}

// 显示任务进度对话框
const openTaskProgressDialog = (taskId, fileName) => {
  currentTask.value = {
    id: taskId,
    fileName: fileName,
    status: 'PENDING',
    progress: 0,
    totalCount: 0,
    processedCount: 0,
    successCount: 0,
    skipCount: 0,
    errorCount: 0
  }
  
  showTaskProgressDialog.value = true
  
  // 开始轮询任务进度
  startTaskProgressPolling()
}

// 开始轮询任务进度
const startTaskProgressPolling = () => {
  if (taskProgressTimer.value) {
    clearInterval(taskProgressTimer.value)
  }
  
  taskProgressTimer.value = setInterval(async () => {
    try {
      const response = await monitorApi.getTaskProgress(currentTask.value.id)
      if (response.code === 200) {
        const taskData = response.data
        currentTask.value = { ...currentTask.value, ...taskData }
        
        // 如果任务完成或失败，停止轮询
        if (taskData.status === 'COMPLETED' || taskData.status === 'FAILED') {
          clearInterval(taskProgressTimer.value)
          taskProgressTimer.value = null
          
          // 任务完成后刷新监控列表
          if (taskData.status === 'COMPLETED') {
            await loadMonitorVideos()
          }
        }
      }
    } catch (error) {
      console.error('查询任务进度失败:', error)
    }
  }, 2000) // 每2秒查询一次
}

// 停止轮询并关闭对话框
const closeTaskProgressDialog = () => {
  if (taskProgressTimer.value) {
    clearInterval(taskProgressTimer.value)
    taskProgressTimer.value = null
  }
  showTaskProgressDialog.value = false
}

// 获取任务状态文本
const getTaskStatusText = (status) => {
  switch (status) {
    case 'PENDING': return '等待处理'
    case 'PROCESSING': return '处理中'
    case 'COMPLETED': return '已完成'
    case 'FAILED': return '处理失败'
    default: return '未知状态'
  }
}

// 获取任务状态类型
const getTaskStatusType = (status) => {
  switch (status) {
    case 'PENDING': return 'info'
    case 'PROCESSING': return 'warning'
    case 'COMPLETED': return 'success'
    case 'FAILED': return 'danger'
    default: return 'info'
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
  // status=1是启用状态，status=0是停用状态，其他状态都是异常状态
  const currentStatus = row.monitorVideo?.status
  const newStatus = currentStatus === 1 ? 0 : 1
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
  if (command === 'updateEmail') {
    emailForm.value.email = authStore.user?.email || ''
    showUpdateEmailDialog.value = true
    return
  }
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

const isValidEmail = (email) => {
  const pattern = /^[\w.!#$%&'*+/=?^`{|}~-]+@[\w-]+(\.[\w-]+)+$/
  return pattern.test(email)
}

const submitUpdateEmail = async () => {
  const email = (emailForm.value.email || '').trim()
  if (!email) {
    ElMessage.warning('请输入邮箱地址')
    return
  }
  if (!isValidEmail(email)) {
    ElMessage.warning('邮箱格式不正确')
    return
  }
  updateEmailLoading.value = true
  try {
    const res = await authApi.updateEmail({ email })
    if (res.code === 200) {
      authStore.setUser({ ...(authStore.user || {}), email })
      ElMessage.success('邮箱更新成功')
      showUpdateEmailDialog.value = false
    } else {
      ElMessage.error(res.message || '邮箱更新失败')
    }
  } catch (e) {
    ElMessage.error('邮箱更新失败，请稍后重试')
  } finally {
    updateEmailLoading.value = false
  }
}

const clearMusicFilter = () => {
  currentMusicId.value = null
  ElMessage.success('已清除音乐过滤')
}

const goBackFromMusic = () => {
  router.push('/music')
}

const goToAuthor = (row) => {
  const userId = row?.videoInfo?.authorId || row?.authorInfo?.userId
  if (userId) {
    router.push(`/author/${userId}`)
  } else {
    ElMessage.warning('无法获取播主ID')
  }
}

const handleRowClick = (row) => {
  // 点击监控行时跳转到该监控的统计页面
  if (row.monitorVideo?.awemeId) {
    viewStats(row.monitorVideo.awemeId)
  }
}

onMounted(() => {
  // 检查是否有音乐ID查询参数
  if (route.query.musicId) {
    currentMusicId.value = parseInt(route.query.musicId)
    // 拉取音乐名称用于标题显示
    musicApi.getMusicById(currentMusicId.value).then(res => {
      if (res?.code === 200) currentMusicInfo.value = res.data
    }).catch(() => {})
  }
  loadMonitorVideos()
})

onUnmounted(() => {
  // 清理定时器
  if (taskProgressTimer.value) {
    clearInterval(taskProgressTimer.value)
    taskProgressTimer.value = null
  }
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
  width: 180px;
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

.music-filter-tip {
  font-size: 16px;
  color: #409eff;
  font-weight: normal;
  margin-left: 12px;
}

.music-meta {
  font-size: 18px;
  color: #6b7280;
  font-weight: 500;
}

.page-meta {
  margin: 6px 0 0 0;
  color: #6b7280;
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
  margin-bottom: 12px; /* 更靠近监控列表 */
  padding: 16px 20px;
  background: #fff;
  border-radius: 12px;
  border: 1px solid #e6e8eb;
}

/* 区块轻分割线 */
.section-divider {
  height: 1px;
  background: #eceff5;
  margin: 4px 0 10px; /* 减小与统计卡片的距离 */
}

.toolbar-left {
  display: flex;
  gap: 12px;
}

.stats-row {
  display: grid;
  grid-template-columns: repeat(4, 1fr);
  gap: 18px;
  margin: 20px 0 16px; /* 减小与分割线的距离 */
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
  cursor: pointer; /* 添加鼠标指针样式 */
}

.stat-card:hover {
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.1);
  transform: translateY(-2px);
}

.stat-card.total .stat-icon {
  background: linear-gradient(135deg, #6366f1 0%, #8b8df5 100%);
  color: #fff;
}

.stat-card.monitoring .stat-icon {
  background: linear-gradient(135deg, #10b981 0%, #34d399 100%);
  color: #fff;
}

.stat-card.inactive .stat-icon {
  background: linear-gradient(135deg, #fa709a 0%, #fee140 100%);
  color: white;
}

.stat-card.error .stat-icon {
  background: linear-gradient(135deg, #f59e0b 0%, #fbbf24 100%);
  color: #fff;
}

.stat-card.auto .stat-icon {
  background: linear-gradient(135deg, #06b6d4 0%, #0ea5e9 100%);
  color: #fff;
}

.stat-card.is-active {
  border: 2px solid rgba(99, 102, 241, 0.35);
  box-shadow: 0 6px 16px rgba(99, 102, 241, 0.18);
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

.author-name {
  display: flex;
  flex-direction: column;
  align-items: flex-start;
  gap: 2px;
}

.author-nickname {
  font-weight: 600;
  color: var(--el-color-primary);
  font-size: 12px;
  line-height: 1.2;
}

.author-followers-tag {
  border: none;
  background: #f4f6fb;
  color: #62738a;
}

.stats-preview {
  display: flex;
  gap: 8px;
  align-items: center;
}

.stats-item {
  display: flex;
  align-items: center;
  gap: 3px;
  font-size: 12px;
  color: #6b7280;
}

.heart-icon {
  display: flex;
  align-items: center;
  color: #ef4444; /* 红色心型 */
}

.music-info {
  display: flex;
  flex-direction: column;
  gap: 1px;
}

.music-title {
  font-weight: 500;
  font-size: 12px;
  color: #374151;
  line-height: 1.4;
}

.music-author {
  font-size: 11px;
  color: #6b7280;
  line-height: 1.2;
}

/* 紧凑版统计数据样式 */
.stats-preview-compact {
  display: flex;
  flex-direction: column;
  gap: 2px;
  align-items: center;
}

.stats-item-compact {
  display: flex;
  align-items: center;
  gap: 2px;
  font-size: 11px;
  color: #6b7280;
}

.heart-icon-small {
  display: flex;
  align-items: center;
  color: #ef4444;
}

.stats-number {
  font-size: 11px;
  font-weight: 500;
}

.na-text-small {
  color: #9ca3af;
  font-style: italic;
  font-size: 11px;
}

.publish-time {
  font-size: 12px;
  color: #374151;
  line-height: 1.4;
}

.table-actions {
  display: flex;
  gap: 6px;
  align-items: center;
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

/* 修复状态标签的小黑点问题 */
.status-tag {
  border: none !important;
}

.status-tag::after {
  display: none !important;
}

:deep(.el-tag) {
  border: none !important;
}

:deep(.el-tag::after) {
  display: none !important;
}

/* 视频链接换行显示 */
.video-url-wrap {
  max-width: 100%;
  line-height: 1.4;
}

.video-link {
  word-break: break-all;
  white-space: normal;
  line-height: 1.4;
  display: inline-block;
  max-width: 100%;
}

:deep(.video-link .el-link__inner) {
  word-break: break-all;
  white-space: normal;
  line-height: 1.4;
}

/* 任务进度对话框样式 */
.task-progress-container {
  padding: 10px 0;
}

.task-info {
  margin-bottom: 20px;
}

.task-info p {
  margin: 8px 0;
  line-height: 1.5;
}

.progress-section {
  margin: 20px 0;
}

.progress-stats {
  margin-top: 15px;
  padding: 10px;
  background-color: #f5f7fa;
  border-radius: 6px;
}

.task-stats-row {
  display: flex;
  justify-content: space-between;
  margin: 5px 0;
  font-size: 14px;
}

.processing-tip, .completed-message, .failed-message {
  display: flex;
  align-items: center;
  gap: 8px;
  margin: 15px 0;
  padding: 10px;
  border-radius: 6px;
  font-weight: 500;
}

.processing-tip {
  background-color: #fff7e6;
  color: #e6a23c;
}

.completed-message {
  background-color: #f0f9ff;
  color: #67c23a;
}

.failed-message {
  background-color: #fef0f0;
  color: #f56c6c;
}

.rotating {
  animation: rotate 2s linear infinite;
}

@keyframes rotate {
  from {
    transform: rotate(0deg);
  }
  to {
    transform: rotate(360deg);
  }
}
</style>