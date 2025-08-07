<template>
  <div class="music-detail-layout">
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
          <el-menu-item index="/music-monitor" class="menu-item">
            <el-icon><Headset /></el-icon>
            <span>音乐监控</span>
          </el-menu-item>
          <el-menu-item index="/music" class="menu-item">
            <el-icon><MusicNote /></el-icon>
            <span>音乐管理</span>
          </el-menu-item>
        </el-menu>
      </nav>

      <!-- 主内容区 -->
      <main class="content">
        <!-- 面包屑导航 -->
        <div class="breadcrumb-container">
          <el-breadcrumb separator="/">
            <el-breadcrumb-item :to="{ path: '/music-monitor' }">音乐监控</el-breadcrumb-item>
            <el-breadcrumb-item>{{ musicInfo?.title || '音乐详情' }}</el-breadcrumb-item>
          </el-breadcrumb>
        </div>

        <!-- 音乐信息卡片 -->
        <div class="music-info-card" v-if="musicInfo">
          <div class="music-info-header">
            <div class="music-icon">
              <el-icon size="32"><MusicNote /></el-icon>
            </div>
            <div class="music-details">
              <h2 class="music-title">{{ musicInfo.title }}</h2>
              <p class="music-meta">
                <span class="music-author">{{ musicInfo.author }}</span>
                <span v-if="musicInfo.album" class="music-album">• {{ musicInfo.album }}</span>
              </p>
              <div class="music-tags" v-if="musicInfo.tagList">
                <el-tag 
                  v-for="tag in musicInfo.tagList.split(',')" 
                  :key="tag" 
                  size="small"
                  class="music-tag"
                >
                  {{ tag }}
                </el-tag>
              </div>
            </div>
            <div class="music-actions">
              <el-button @click="goBack" :icon="ArrowLeft">返回</el-button>
              <el-button @click="loadMonitorVideos" :loading="loading" :icon="Refresh">
                刷新
              </el-button>
            </div>
          </div>
        </div>

        <!-- 搜索栏 -->
        <div class="search-bar">
          <el-input
            v-model="searchKeyword"
            placeholder="搜索视频ID或链接"
            :prefix-icon="Search"
            style="width: 400px;"
            clearable
            size="large"
          />
        </div>

        <!-- 统计卡片 -->
        <div class="stats-row">
          <div 
            class="stat-card total"
            :class="{ active: currentFilter === 'all' }"
            @click="filterVideos('all')"
          >
            <div class="stat-icon">
              <el-icon size="20"><VideoCamera /></el-icon>
            </div>
            <div class="stat-info">
              <div class="stat-value">{{ allVideos.length }}</div>
              <div class="stat-label">监控视频总数</div>
            </div>
          </div>
          
          <div 
            class="stat-card monitoring"
            :class="{ active: currentFilter === 'monitoring' }"
            @click="filterVideos('monitoring')"
          >
            <div class="stat-icon">
              <el-icon size="20"><CircleCheck /></el-icon>
            </div>
            <div class="stat-info">
              <div class="stat-value">{{ monitoringVideos.length }}</div>
              <div class="stat-label">监控中</div>
            </div>
          </div>
          
          <div 
            class="stat-card error"
            :class="{ active: currentFilter === 'error' }"
            @click="filterVideos('error')"
          >
            <div class="stat-icon">
              <el-icon size="20"><Warning /></el-icon>
            </div>
            <div class="stat-info">
              <div class="stat-value">{{ errorVideos.length }}</div>
              <div class="stat-label">异常监控</div>
            </div>
          </div>
          
          <div 
            class="stat-card auto"
            :class="{ active: currentFilter === 'auto' }"
            @click="filterVideos('auto')"
          >
            <div class="stat-icon">
              <el-icon size="20"><MagicStick /></el-icon>
            </div>
            <div class="stat-info">
              <div class="stat-value">{{ autoVideos.length }}</div>
              <div class="stat-label">自动添加</div>
            </div>
          </div>
        </div>

        <!-- 监控视频列表 -->
        <div class="monitor-list-card">
          <div class="card-header">
            <h3 class="card-title">监控视频列表</h3>
            <div class="card-actions">
              <el-button-group>
                <el-button 
                  :type="viewMode === 'grid' ? 'primary' : ''"
                  @click="viewMode = 'grid'"
                  :icon="Grid"
                >
                  网格视图
                </el-button>
                <el-button 
                  :type="viewMode === 'list' ? 'primary' : ''"
                  @click="viewMode = 'list'"
                  :icon="List"
                >
                  列表视图
                </el-button>
              </el-button-group>
            </div>
          </div>

          <!-- 网格视图 -->
          <div v-if="viewMode === 'grid'" class="video-grid">
            <div 
              v-for="video in filteredMonitorVideos" 
              :key="video.id" 
              class="video-card"
              @click="goToStats(video.awemeId)"
            >
              <div class="video-header">
                <div class="video-status">
                  <el-tag 
                    :type="getStatusType(video.status)"
                    size="small"
                  >
                    {{ getStatusText(video.status) }}
                  </el-tag>
                  <el-tag 
                    :type="video.type === 1 ? 'primary' : 'info'"
                    size="small"
                  >
                    {{ video.type === 1 ? '手动' : '自动' }}
                  </el-tag>
                </div>
                <div class="video-actions">
                  <el-tooltip content="打开视频" placement="top">
                    <el-button 
                      type="success" 
                      size="small" 
                      :icon="Link"
                      circle
                      @click.stop="openVideo(video.videoUrl)"
                    />
                  </el-tooltip>
                </div>
              </div>
              
              <div class="video-content">
                <div class="video-id">{{ video.awemeId }}</div>
                <div class="video-url" :title="video.videoUrl">
                  {{ truncateUrl(video.videoUrl) }}
                </div>
                <div class="video-time">
                  发布时间：{{ formatTimestamp(video.videoPublishTime) }}
                </div>
                
                <!-- 视频统计数据 -->
                <div class="video-stats">
                  <div class="stat-item">
                    <el-icon><Star /></el-icon>
                    <span>{{ formatNumber(getVideoStats(video.awemeId).diggCount) }}</span>
                  </div>
                  <div class="stat-item">
                    <el-icon><ChatDotRound /></el-icon>
                    <span>{{ formatNumber(getVideoStats(video.awemeId).commentCount) }}</span>
                  </div>
                  <div class="stat-item">
                    <el-icon><Collection /></el-icon>
                    <span>{{ formatNumber(getVideoStats(video.awemeId).collectCount) }}</span>
                  </div>
                  <div class="stat-item">
                    <el-icon><Share /></el-icon>
                    <span>{{ formatNumber(getVideoStats(video.awemeId).shareCount) }}</span>
                  </div>
                </div>
              </div>
              
              <div class="video-footer">
                <div class="video-dates">
                  <div class="create-time">
                    添加时间：{{ formatDate(video.createTime) }}
                  </div>
                </div>
              </div>
            </div>
          </div>

          <!-- 列表视图 -->
          <div v-else class="video-table">
            <el-table 
              :data="filteredMonitorVideos" 
              style="width: 100%"
              :loading="loading"
              empty-text="暂无监控视频"
              @row-click="(row) => goToStats(row.awemeId)"
              class="clickable-table"
            >
              <el-table-column prop="awemeId" label="视频ID" width="180">
                <template #default="{ row }">
                  <span class="video-id-text">{{ row.awemeId }}</span>
                </template>
              </el-table-column>
              
              <el-table-column prop="videoUrl" label="视频链接" min-width="200">
                <template #default="{ row }">
                  <el-tooltip :content="row.videoUrl" placement="top">
                    <span class="video-url-text">{{ truncateUrl(row.videoUrl) }}</span>
                  </el-tooltip>
                </template>
              </el-table-column>
              
              <el-table-column prop="type" label="类型" width="80">
                <template #default="{ row }">
                  <el-tag 
                    :type="row.type === 1 ? 'primary' : 'info'"
                    size="small"
                  >
                    {{ row.type === 1 ? '手动' : '自动' }}
                  </el-tag>
                </template>
              </el-table-column>
              
              <el-table-column prop="status" label="状态" width="80">
                <template #default="{ row }">
                  <el-tag 
                    :type="getStatusType(row.status)"
                    size="small"
                  >
                    {{ getStatusText(row.status) }}
                  </el-tag>
                </template>
              </el-table-column>
              
              <el-table-column prop="videoPublishTime" label="发布时间" width="120">
                <template #default="{ row }">
                  {{ formatTimestamp(row.videoPublishTime) }}
                </template>
              </el-table-column>
              
              <el-table-column prop="createTime" label="添加时间" width="120">
                <template #default="{ row }">
                  {{ formatDate(row.createTime) }}
                </template>
              </el-table-column>
              
              <el-table-column label="点赞" width="80">
                <template #default="{ row }">
                  <span class="stat-number">{{ formatNumber(getVideoStats(row.awemeId).diggCount) }}</span>
                </template>
              </el-table-column>
              
              <el-table-column label="评论" width="80">
                <template #default="{ row }">
                  <span class="stat-number">{{ formatNumber(getVideoStats(row.awemeId).commentCount) }}</span>
                </template>
              </el-table-column>
              
              <el-table-column label="收藏" width="80">
                <template #default="{ row }">
                  <span class="stat-number">{{ formatNumber(getVideoStats(row.awemeId).collectCount) }}</span>
                </template>
              </el-table-column>
              
              <el-table-column label="分享" width="80">
                <template #default="{ row }">
                  <span class="stat-number">{{ formatNumber(getVideoStats(row.awemeId).shareCount) }}</span>
                </template>
              </el-table-column>
              
              <el-table-column label="操作" width="80" fixed="right">
                <template #default="{ row }">
                  <el-tooltip content="打开视频" placement="top">
                    <el-button 
                      type="success" 
                      size="small" 
                      :icon="Link"
                      @click.stop="openVideo(row.videoUrl)"
                    />
                  </el-tooltip>
                </template>
              </el-table-column>
            </el-table>
          </div>

          <!-- 空状态 -->
          <el-empty 
            v-if="!loading && filteredMonitorVideos.length === 0"
            description="该音乐暂无监控视频"
            :image-size="120"
          />
        </div>
      </main>
    </div>
  </div>
</template>

<script setup>
import { ref, computed, onMounted } from 'vue'
import { useRouter, useRoute } from 'vue-router'
import { useAuthStore } from '@/store/auth'
import { musicApi } from '@/api/music'
import { videoApi } from '@/api/video'
import { ElMessage, ElMessageBox } from 'element-plus'

const router = useRouter()
const route = useRoute()
const authStore = useAuthStore()

// 响应式数据
const loading = ref(false)
const musicInfo = ref(null)
const monitorVideos = ref([])
const videoStatsMap = ref(new Map()) // 存储视频统计数据
const searchKeyword = ref('')
const viewMode = ref('grid')
const currentFilter = ref('all')

// 计算属性
const allVideos = computed(() => monitorVideos.value)

const monitoringVideos = computed(() => {
  return monitorVideos.value.filter(video => video.status === 1)
})

const errorVideos = computed(() => {
  return monitorVideos.value.filter(video => video.status === 2 || video.status === 3)
})

const autoVideos = computed(() => {
  return monitorVideos.value.filter(video => video.type === 0)
})

const filteredMonitorVideos = computed(() => {
  let videos = []
  
  // 根据当前过滤器选择视频
  switch (currentFilter.value) {
    case 'all':
      videos = allVideos.value
      break
    case 'monitoring':
      videos = monitoringVideos.value
      break
    case 'error':
      videos = errorVideos.value
      break
    case 'auto':
      videos = autoVideos.value
      break
    default:
      videos = allVideos.value
  }
  
  // 搜索过滤
  if (searchKeyword.value) {
    const keyword = searchKeyword.value.toLowerCase()
    videos = videos.filter(video => 
      video.awemeId?.toLowerCase().includes(keyword) ||
      video.videoUrl?.toLowerCase().includes(keyword)
    )
  }
  
  return videos
})

// 方法
const loadMusicInfo = async () => {
  const musicId = route.params.musicId
  if (!musicId) return
  
  try {
    const response = await musicApi.getMusicById(musicId)
    if (response.code === 200) {
      musicInfo.value = response.data
    } else {
      ElMessage.error(response.message || '获取音乐信息失败')
    }
  } catch (error) {
    console.error('获取音乐信息失败:', error)
    ElMessage.error('获取音乐信息失败')
  }
}

const loadMonitorVideos = async () => {
  const musicId = route.params.musicId
  if (!musicId) return
  
  loading.value = true
  try {
    const response = await musicApi.getMonitorVideosByMusicId(musicId)
    
    if (response.code === 200) {
      monitorVideos.value = response.data || []
      // 并行获取每个视频的最新统计数据
      await loadVideoStats()
    } else {
      ElMessage.error(response.message || '获取监控视频失败')
    }
  } catch (error) {
    console.error('获取监控视频失败:', error)
    ElMessage.error('获取监控视频失败')
  } finally {
    loading.value = false
  }
}

const loadVideoStats = async () => {
  if (monitorVideos.value.length === 0) return
  
  const promises = monitorVideos.value.map(async (video) => {
    try {
      const response = await videoApi.getLatestVideoStats(video.awemeId)
      if (response.code === 200 && response.data) {
        videoStatsMap.value.set(video.awemeId, response.data)
      }
    } catch (error) {
      console.error(`获取视频 ${video.awemeId} 统计数据失败:`, error)
      // 失败时设置默认值
      videoStatsMap.value.set(video.awemeId, {
        diggCount: 0,
        commentCount: 0,
        collectCount: 0,
        shareCount: 0
      })
    }
  })
  
  await Promise.all(promises)
}

const getVideoStats = (awemeId) => {
  return videoStatsMap.value.get(awemeId) || {
    diggCount: 0,
    commentCount: 0,
    collectCount: 0,
    shareCount: 0
  }
}

const filterVideos = (filterType) => {
  currentFilter.value = filterType
}

const goToStats = (awemeId) => {
  router.push(`/stats/${awemeId}`)
}

const openVideo = (videoUrl) => {
  window.open(videoUrl, '_blank')
}

const goBack = () => {
  router.push('/music-monitor')
}

const getStatusType = (status) => {
  const statusMap = {
    1: 'success',  // 监控中
    0: 'warning',  // 已停用
    2: 'danger',   // 已删除或无权限
    3: 'danger'    // 其他失败
  }
  return statusMap[status] || 'info'
}

const getStatusText = (status) => {
  const statusMap = {
    1: '监控中',
    0: '已停用',
    2: '已删除',
    3: '失败'
  }
  return statusMap[status] || '未知'
}

const truncateUrl = (url) => {
  if (!url) return ''
  return url.length > 50 ? url.substring(0, 50) + '...' : url
}

const formatDate = (dateString) => {
  if (!dateString) return '-'
  return new Date(dateString).toLocaleDateString('zh-CN')
}

const formatTimestamp = (timestamp) => {
  if (!timestamp) return '-'
  // timestamp是秒级时间戳，需要转换为毫秒
  const date = new Date(timestamp * 1000)
  return date.toLocaleDateString('zh-CN')
}

const formatNumber = (num) => {
  if (num === undefined || num === null) return '0'
  if (num >= 10000) {
    return (num / 10000).toFixed(1) + 'w'
  } else if (num >= 1000) {
    return (num / 1000).toFixed(1) + 'k'
  }
  return num.toString()
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

// 生命周期
onMounted(() => {
  loadMusicInfo()
  loadMonitorVideos()
})
</script>

<style scoped>
.music-detail-layout {
  height: 100vh;
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  display: flex;
  flex-direction: column;
}

.header {
  background: rgba(255, 255, 255, 0.1);
  backdrop-filter: blur(10px);
  border-bottom: 1px solid rgba(255, 255, 255, 0.2);
  padding: 0 24px;
  height: 64px;
  display: flex;
  align-items: center;
  justify-content: space-between;
  position: sticky;
  top: 0;
  z-index: 1000;
}

.header-left .system-title {
  color: white;
  font-size: 20px;
  font-weight: 600;
  margin: 0;
}

.user-info {
  display: flex;
  align-items: center;
  gap: 12px;
  color: white;
}

.username {
  font-weight: 500;
}

.user-dropdown {
  cursor: pointer;
}

.main-container {
  flex: 1;
  display: flex;
  overflow: hidden;
}

.sidebar {
  width: 200px;
  background: rgba(255, 255, 255, 0.1);
  backdrop-filter: blur(10px);
  border-right: 1px solid rgba(255, 255, 255, 0.2);
}

.sidebar-menu {
  background: transparent;
  border: none;
  padding: 16px 0;
}

.menu-item {
  margin: 4px 16px;
  border-radius: 8px;
  color: rgba(255, 255, 255, 0.8);
  transition: all 0.3s ease;
}

.menu-item:hover {
  background: rgba(255, 255, 255, 0.1);
  color: white;
}

.menu-item.is-active {
  background: rgba(255, 255, 255, 0.2);
  color: white;
}

.content {
  flex: 1;
  padding: 24px;
  overflow: auto;
}

.breadcrumb-container {
  margin-bottom: 24px;
}

:deep(.el-breadcrumb__inner) {
  color: rgba(255, 255, 255, 0.8);
}

:deep(.el-breadcrumb__inner.is-link) {
  color: white;
}

.music-info-card {
  background: rgba(255, 255, 255, 0.1);
  backdrop-filter: blur(10px);
  border: 1px solid rgba(255, 255, 255, 0.2);
  border-radius: 12px;
  padding: 24px;
  margin-bottom: 24px;
}

.music-info-header {
  display: flex;
  align-items: center;
  gap: 20px;
}

.music-icon {
  width: 64px;
  height: 64px;
  background: linear-gradient(135deg, #667eea, #764ba2);
  border-radius: 12px;
  display: flex;
  align-items: center;
  justify-content: center;
  color: white;
}

.music-details {
  flex: 1;
}

.music-title {
  color: white;
  font-size: 24px;
  font-weight: 700;
  margin: 0 0 8px 0;
}

.music-meta {
  color: rgba(255, 255, 255, 0.8);
  font-size: 16px;
  margin: 0 0 12px 0;
}

.music-author {
  font-weight: 500;
}

.music-album {
  color: rgba(255, 255, 255, 0.7);
}

.music-tags {
  display: flex;
  flex-wrap: wrap;
  gap: 8px;
}

.music-tag {
  background: rgba(255, 255, 255, 0.2);
  border: none;
  color: white;
}

.search-bar {
  display: flex;
  justify-content: center;
  align-items: center;
  margin-bottom: 32px;
  background: rgba(255, 255, 255, 0.1);
  backdrop-filter: blur(10px);
  padding: 20px;
  border-radius: 12px;
  border: 1px solid rgba(255, 255, 255, 0.2);
}

.stats-row {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
  gap: 20px;
  margin-bottom: 24px;
}

.stat-card {
  background: rgba(255, 255, 255, 0.1);
  backdrop-filter: blur(10px);
  border: 1px solid rgba(255, 255, 255, 0.2);
  border-radius: 12px;
  padding: 20px;
  display: flex;
  align-items: center;
  gap: 16px;
  transition: all 0.3s ease;
  cursor: pointer;
}

.stat-card:hover {
  transform: translateY(-2px);
  background: rgba(255, 255, 255, 0.15);
}

.stat-card.active {
  background: rgba(255, 255, 255, 0.2);
  border-color: rgba(255, 255, 255, 0.4);
  box-shadow: 0 4px 16px rgba(255, 255, 255, 0.1);
}

.stat-icon {
  width: 48px;
  height: 48px;
  border-radius: 10px;
  display: flex;
  align-items: center;
  justify-content: center;
  color: white;
}

.stat-card.total .stat-icon {
  background: linear-gradient(135deg, #667eea, #764ba2);
}

.stat-card.monitoring .stat-icon {
  background: linear-gradient(135deg, #11998e, #38ef7d);
}

.stat-card.error .stat-icon {
  background: linear-gradient(135deg, #f093fb, #f5576c);
}

.stat-card.auto .stat-icon {
  background: linear-gradient(135deg, #ffecd2, #fcb69f);
}

.stat-value {
  font-size: 24px;
  font-weight: 700;
  color: white;
  line-height: 1;
}

.stat-label {
  font-size: 14px;
  color: rgba(255, 255, 255, 0.8);
  margin-top: 4px;
}

.monitor-list-card {
  background: rgba(255, 255, 255, 0.1);
  backdrop-filter: blur(10px);
  border: 1px solid rgba(255, 255, 255, 0.2);
  border-radius: 12px;
  padding: 24px;
}

.card-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 24px;
}

.card-title {
  color: white;
  font-size: 18px;
  font-weight: 600;
  margin: 0;
}

.video-grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(350px, 1fr));
  gap: 20px;
}

.video-card {
  background: rgba(255, 255, 255, 0.05);
  border: 1px solid rgba(255, 255, 255, 0.1);
  border-radius: 8px;
  padding: 16px;
  transition: all 0.3s ease;
  cursor: pointer;
}

.video-card:hover {
  transform: translateY(-2px);
  background: rgba(255, 255, 255, 0.1);
  box-shadow: 0 4px 16px rgba(0, 0, 0, 0.1);
}

.video-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 12px;
}

.video-status {
  display: flex;
  gap: 8px;
}

.video-content {
  margin-bottom: 12px;
}

.video-id {
  color: white;
  font-weight: 600;
  font-size: 14px;
  margin-bottom: 4px;
}

.video-url {
  color: rgba(255, 255, 255, 0.7);
  font-size: 12px;
  margin-bottom: 4px;
}

.video-time {
  color: rgba(255, 255, 255, 0.6);
  font-size: 12px;
  margin-bottom: 8px;
}

.video-stats {
  display: flex;
  gap: 16px;
  flex-wrap: wrap;
}

.video-stats .stat-item {
  display: flex;
  align-items: center;
  gap: 4px;
  color: rgba(255, 255, 255, 0.8);
  font-size: 12px;
}

.video-stats .stat-item .el-icon {
  font-size: 14px;
  color: rgba(255, 255, 255, 0.6);
}

.video-footer {
  border-top: 1px solid rgba(255, 255, 255, 0.1);
  padding-top: 8px;
}

.create-time {
  color: rgba(255, 255, 255, 0.6);
  font-size: 12px;
}

.video-table {
  margin-top: 16px;
}

/* 表格整体样式 */
:deep(.el-table) {
  background: transparent !important;
  color: white !important;
  border: none !important;
}

/* 强制覆盖表格默认背景 */
:deep(.el-table),
:deep(.el-table__inner-wrapper),
:deep(.el-table__body-wrapper),
:deep(.el-table__header-wrapper) {
  background: transparent !important;
  background-color: transparent !important;
}

/* 表格行背景 */
:deep(.el-table__row) {
  background: transparent !important;
  background-color: transparent !important;
}

:deep(.el-table__row:nth-child(even)) {
  background: transparent !important;
  background-color: transparent !important;
}

:deep(.el-table__row:nth-child(odd)) {
  background: transparent !important;
  background-color: transparent !important;
}

/* 表格头部样式 */
:deep(.el-table__header-wrapper) {
  background: transparent !important;
}

:deep(.el-table__header) {
  background: transparent !important;
}

:deep(.el-table th) {
  background: rgba(255, 255, 255, 0.1) !important;
  color: white !important;
  border: none !important;
  border-bottom: 1px solid rgba(255, 255, 255, 0.2) !important;
}

:deep(.el-table th .cell) {
  color: white !important;
  font-weight: 600 !important;
}

/* 表格主体样式 */
:deep(.el-table__body-wrapper) {
  background: transparent !important;
}

:deep(.el-table__body) {
  background: transparent !important;
}

:deep(.el-table td) {
  background: transparent !important;
  background-color: transparent !important;
  color: rgba(255, 255, 255, 0.9) !important;
  border: none !important;
  border-bottom: 1px solid rgba(255, 255, 255, 0.1) !important;
}

:deep(.el-table td:nth-child(even)) {
  background: transparent !important;
  background-color: transparent !important;
}

:deep(.el-table td:nth-child(odd)) {
  background: transparent !important;
  background-color: transparent !important;
}

:deep(.el-table td .cell) {
  color: rgba(255, 255, 255, 0.9) !important;
}

/* 表格行悬停效果 */
:deep(.el-table tr:hover > td) {
  background: rgba(255, 255, 255, 0.05) !important;
}

/* 可点击表格行样式 */
:deep(.clickable-table .el-table__row) {
  cursor: pointer;
}

:deep(.clickable-table .el-table__row:hover) {
  background: rgba(255, 255, 255, 0.08) !important;
}

/* 表格边框和分割线 */
:deep(.el-table--border) {
  border: none !important;
}

:deep(.el-table--border::after) {
  display: none !important;
}

:deep(.el-table--border .el-table__inner-wrapper::after) {
  display: none !important;
}

/* 表格空状态 */
:deep(.el-table__empty-block) {
  background: transparent !important;
}

:deep(.el-table__empty-text) {
  color: rgba(255, 255, 255, 0.8) !important;
}

/* 表格内部包装器 */
:deep(.el-table__inner-wrapper) {
  background: transparent !important;
  background-color: transparent !important;
}

/* 表格表格样式 */
:deep(.el-table__body) {
  background: transparent !important;
  background-color: transparent !important;
}

:deep(.el-table__header) {
  background: transparent !important;
  background-color: transparent !important;
}

/* 表格行样式 */
:deep(.el-table__row) {
  background: transparent !important;
  background-color: transparent !important;
}

/* 表格单元格样式 */
:deep(.el-table__cell) {
  background: transparent !important;
  background-color: transparent !important;
}

/* 强制覆盖所有可能的表格背景 */
:deep(.el-table *),
:deep(.el-table__inner-wrapper *),
:deep(.el-table__body-wrapper *),
:deep(.el-table__header-wrapper *) {
  background: transparent !important;
  background-color: transparent !important;
}

/* 表格行和单元格的默认背景 */
:deep(.el-table__row--striped) {
  background: transparent !important;
  background-color: transparent !important;
}

:deep(.el-table__row--striped td) {
  background: transparent !important;
  background-color: transparent !important;
}

/* 表格hover状态 */
:deep(.el-table__row:hover td) {
  background: rgba(255, 255, 255, 0.05) !important;
  background-color: rgba(255, 255, 255, 0.05) !important;
}

/* 表格固定列样式 */
:deep(.el-table__fixed) {
  background: transparent !important;
}

:deep(.el-table__fixed-right) {
  background: transparent !important;
}

/* 表格滚动条样式 */
:deep(.el-table__body-wrapper::-webkit-scrollbar) {
  width: 8px;
  height: 8px;
}

:deep(.el-table__body-wrapper::-webkit-scrollbar-track) {
  background: rgba(255, 255, 255, 0.1);
  border-radius: 4px;
}

:deep(.el-table__body-wrapper::-webkit-scrollbar-thumb) {
  background: rgba(255, 255, 255, 0.3);
  border-radius: 4px;
}

:deep(.el-table__body-wrapper::-webkit-scrollbar-thumb:hover) {
  background: rgba(255, 255, 255, 0.5);
}

.video-id-text {
  font-family: monospace;
  font-weight: 600;
}

.video-url-text {
  color: rgba(255, 255, 255, 0.7);
  font-size: 12px;
}

.stat-number {
  color: rgba(255, 255, 255, 0.9) !important;
  font-weight: 500;
}

:deep(.el-empty__description p) {
  color: rgba(255, 255, 255, 0.8);
}
</style>
