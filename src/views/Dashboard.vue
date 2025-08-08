<template>
  <div class="dashboard-layout">
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
          <el-menu-item index="/music-monitor" class="menu-item">
            <el-icon><Headset /></el-icon>
            <span>音乐监控</span>
          </el-menu-item>
        </el-menu>
      </nav>

      <!-- 主内容区 -->
      <main class="content">
        <div class="page-header">
          <h2 class="page-title">数据概览</h2>
          <p class="page-desc">实时监控您关注的抖音视频数据动态</p>
        </div>

        <!-- 统计卡片 -->
        <div class="stats-grid" v-loading="loading">
          <div class="stat-card">
            <div class="stat-icon total">
              <el-icon size="24"><VideoCamera /></el-icon>
            </div>
            <div class="stat-content">
              <div class="stat-value">{{ monitorVideos.length }}</div>
              <div class="stat-label">监控视频</div>
            </div>
          </div>
          
          <div class="stat-card">
            <div class="stat-icon active">
              <el-icon size="24"><CircleCheck /></el-icon>
            </div>
            <div class="stat-content">
              <div class="stat-value">{{ activeCount }}</div>
              <div class="stat-label">监控中</div>
            </div>
          </div>
          
          <div class="stat-card">
            <div class="stat-icon likes">
              <el-icon size="24"><Star /></el-icon>
            </div>
            <div class="stat-content">
              <div class="stat-value">{{ formatNumber(totalLikes) }}</div>
              <div class="stat-label">总点赞数</div>
            </div>
          </div>
          
          <div class="stat-card">
            <div class="stat-icon comments">
              <el-icon size="24"><ChatDotRound /></el-icon>
            </div>
            <div class="stat-content">
              <div class="stat-value">{{ formatNumber(totalComments) }}</div>
              <div class="stat-label">总评论数</div>
            </div>
          </div>
        </div>

        <!-- 主要内容 -->
        <el-row :gutter="24" class="content-row">
          <!-- 最新动态 -->
          <el-col :span="16">
            <el-card class="content-card">
              <template #header>
                <div class="card-header">
                  <span class="card-title">最新监控动态</span>
                  <el-button type="primary" size="small" @click="loadData" :loading="loading">
                    <el-icon><Refresh /></el-icon>
                    刷新
                  </el-button>
                </div>
              </template>
              
              <div v-if="monitorVideos.length === 0" class="empty-state">
                <el-empty description="暂无监控视频数据">
                  <el-button type="primary" @click="$router.push('/monitor')">
                    <el-icon><Plus /></el-icon>
                    添加监控视频
                  </el-button>
                </el-empty>
              </div>
              
              <div v-else class="video-list">
                <div 
                  v-for="(video, index) in monitorVideos.slice(0, 6)" 
                  :key="index"
                  class="video-item"
                  @click="viewStats(video.monitorVideo?.awemeId)"
                >
                  <div class="video-info">
                    <div class="video-id">{{ video.monitorVideo?.awemeId || 'N/A' }}</div>
                    <div class="video-url">{{ video.monitorVideo?.videoUrl || 'N/A' }}</div>
                  </div>
                  <div class="video-status">
                    <el-tag 
                      :type="getStatusType(video.monitorVideo?.status)"
                      size="small"
                    >
                      {{ getStatusText(video.monitorVideo?.status) }}
                    </el-tag>
                  </div>
                  <div class="video-action">
                    <el-button type="text" size="small">
                      查看详情
                      <el-icon><ArrowRight /></el-icon>
                    </el-button>
                  </div>
                </div>
              </div>
            </el-card>
          </el-col>
          
          <!-- 快速操作 -->
          <el-col :span="8">
            <el-card class="content-card">
              <template #header>
                <span class="card-title">快速操作</span>
              </template>
              
              <div class="quick-actions">
                <el-button 
                  type="primary" 
                  size="large" 
                  class="action-btn"
                  @click="$router.push('/monitor')"
                >
                  <el-icon><Plus /></el-icon>
                  添加监控视频
                </el-button>
                
                <el-button 
                  size="large" 
                  class="action-btn"
                  @click="$router.push('/monitor')"
                >
                  <el-icon><Setting /></el-icon>
                  管理监控列表
                </el-button>
                
                <el-divider />
                
                <div class="system-info">
                  <h4>系统信息</h4>
                  <div class="info-item">
                    <span class="info-label">登录时间：</span>
                    <span class="info-value">{{ loginTime }}</span>
                  </div>
                  <div class="info-item">
                    <span class="info-label">最后更新：</span>
                    <span class="info-value">{{ lastUpdateTime }}</span>
                  </div>
                </div>
              </div>
            </el-card>
          </el-col>
        </el-row>
      </main>
    </div>
  </div>
</template>

<script setup>
import { ref, computed, onMounted } from 'vue'
import { useRouter } from 'vue-router'
import { useAuthStore } from '@/store/auth'
import { monitorApi } from '@/api/monitor'
import { ElMessage, ElMessageBox } from 'element-plus'
import {
  Refresh,
  VideoCamera,
  CircleCheck,
  CircleClose,
  Odometer,
  View,
  Headset,
  ArrowDown
} from '@element-plus/icons-vue'

const router = useRouter()
const authStore = useAuthStore()

const loading = ref(false)
const monitorVideos = ref([])
const loginTime = ref(new Date().toLocaleString())
const lastUpdateTime = ref('')

const activeCount = computed(() => {
  // status=1是正常监控中
  return monitorVideos.value.filter(item => item.monitorVideo?.status === 1).length
})

const totalLikes = computed(() => {
  return monitorVideos.value.reduce((total, item) => {
    return total + (item.latestStats?.diggCount || 0)
  }, 0)
})

const totalComments = computed(() => {
  return monitorVideos.value.reduce((total, item) => {
    return total + (item.latestStats?.commentCount || 0)
  }, 0)
})

const formatNumber = (num) => {
  if (!num) return '0'
  if (num >= 10000) {
    return (num / 10000).toFixed(1) + 'w'
  }
  return num.toString()
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

const loadData = async () => {
  loading.value = true
  try {
    const response = await monitorApi.getMonitorList()
    if (response.code === 200) {
      monitorVideos.value = response.data || []
      lastUpdateTime.value = new Date().toLocaleString()
    } else {
      ElMessage.error(response.message || '加载数据失败')
    }
  } catch (error) {
    ElMessage.error('加载数据失败')
  } finally {
    loading.value = false
  }
}

const viewStats = (awemeId) => {
  if (awemeId) {
    router.push(`/stats/${awemeId}`)
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
  loadData()
})
</script>

<style scoped>
.dashboard-layout {
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

.page-desc {
  margin: 0;
  color: #6b7280;
  font-size: 14px;
}

.stats-grid {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(240px, 1fr));
  gap: 24px;
  margin-bottom: 24px;
}

.stat-card {
  background: #fff;
  border-radius: 12px;
  padding: 24px;
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

.stat-icon {
  width: 48px;
  height: 48px;
  border-radius: 12px;
  display: flex;
  align-items: center;
  justify-content: center;
}

.stat-icon.total { background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); color: white; }
.stat-icon.active { background: linear-gradient(135deg, #f093fb 0%, #f5576c 100%); color: white; }
.stat-icon.likes { background: linear-gradient(135deg, #4facfe 0%, #00f2fe 100%); color: white; }
.stat-icon.comments { background: linear-gradient(135deg, #43e97b 0%, #38f9d7 100%); color: white; }

.stat-value {
  font-size: 28px;
  font-weight: 700;
  color: #1f2937;
  line-height: 1;
}

.stat-label {
  font-size: 14px;
  color: #6b7280;
  margin-top: 4px;
}

.content-row {
  margin-bottom: 24px;
}

.content-card {
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

.empty-state {
  text-align: center;
  padding: 60px 20px;
}

.video-list {
  display: flex;
  flex-direction: column;
  gap: 12px;
}

.video-item {
  display: flex;
  align-items: center;
  padding: 16px;
  background: #f9fafb;
  border-radius: 8px;
  cursor: pointer;
  transition: all 0.2s ease;
}

.video-item:hover {
  background: #f3f4f6;
}

.video-info {
  flex: 1;
}

.video-id {
  font-weight: 600;
  color: #374151;
  margin-bottom: 4px;
}

.video-url {
  font-size: 12px;
  color: #6b7280;
  word-break: break-all;
}

.video-status {
  margin: 0 16px;
}

.quick-actions {
  display: flex;
  flex-direction: column;
  gap: 12px;
}

.action-btn {
  width: 100%;
  height: 44px;
  font-weight: 500;
}

.system-info h4 {
  margin: 16px 0 12px 0;
  font-size: 14px;
  color: #374151;
}

.info-item {
  display: flex;
  justify-content: space-between;
  margin-bottom: 8px;
  font-size: 12px;
}

.info-label {
  color: #6b7280;
}

.info-value {
  color: #374151;
  font-weight: 500;
}

:deep(.el-card__header) {
  padding: 20px 24px;
  border-bottom: 1px solid #f0f0f0;
}

:deep(.el-card__body) {
  padding: 24px;
}
</style>