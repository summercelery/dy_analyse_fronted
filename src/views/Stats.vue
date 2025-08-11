<template>
  <div class="stats-layout">
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
          :default-active="'/music'"
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
        <!-- 页面头部 -->
        <div class="page-header">
          <div class="page-breadcrumb">
            <el-breadcrumb separator="/">
              <el-breadcrumb-item @click="$router.push('/music')" class="breadcrumb-link">
                音乐管理
              </el-breadcrumb-item>
              <el-breadcrumb-item @click="$router.push('/monitor')" class="breadcrumb-link">
                监控管理
              </el-breadcrumb-item>
              <el-breadcrumb-item>视频统计</el-breadcrumb-item>
            </el-breadcrumb>
          </div>
          <div class="page-info">
            <h2 class="page-title">视频数据统计</h2>
            <p class="page-desc">视频ID: {{ $route.params.awemeId }}</p>
          </div>
        </div>

        <!-- 操作栏 -->
        <div class="toolbar">
          <div class="toolbar-left">
            <el-button @click="$router.back()" :icon="ArrowLeft">
              返回
            </el-button>
            <el-button @click="loadData" :loading="loading" :icon="Refresh">
              刷新数据
            </el-button>
          </div>
          <div class="toolbar-right">
            <el-select 
              v-model="statsDays" 
              placeholder="选择时间范围"
              style="width: 140px;"
              @change="loadStatsChart"
            >
              <el-option label="最近7天" value="7" />
              <el-option label="最近15天" value="15" />
              <el-option label="最近30天" value="30" />
            </el-select>
          </div>
        </div>

        <div v-loading="loading" class="stats-content">
          <!-- 统计卡片 -->
          <div v-if="latestStats" class="stats-grid">
            <div 
              class="stat-card likes"
              :class="{ 'is-active': selectedStats.likes }"
              @click="toggleStat('likes')"
            >
              <div class="stat-icon">
                <div class="heart-icon-large">
                  <svg width="24" height="24" viewBox="0 0 24 24" fill="currentColor">
                    <path d="M12 21.35l-1.45-1.32C5.4 15.36 2 12.28 2 8.5 2 5.42 4.42 3 7.5 3c1.74 0 3.41.81 4.5 2.09C13.09 3.81 14.76 3 16.5 3 19.58 3 22 5.42 22 8.5c0 3.78-3.4 6.86-8.55 11.54L12 21.35z"/>
                  </svg>
                </div>
              </div>
              <div class="stat-info">
                <div class="stat-value">{{ formatNumber(latestStats.diggCount) }}</div>
                <div class="stat-label">点赞数</div>
                <div class="stat-trend" v-if="trends.digg">
                  <el-icon :class="{ 'trend-up': trends.digg > 0, 'trend-down': trends.digg < 0 }">
                    <component :is="trends.digg > 0 ? 'ArrowUp' : 'ArrowDown'" />
                  </el-icon>
                  <span>{{ Math.abs(trends.digg) }}%</span>
                </div>
              </div>
            </div>

            <div 
              class="stat-card comments"
              :class="{ 'is-active': selectedStats.comments }"
              @click="toggleStat('comments')"
            >
              <div class="stat-icon">
                <el-icon size="24"><ChatDotRound /></el-icon>
              </div>
              <div class="stat-info">
                <div class="stat-value">{{ formatNumber(latestStats.commentCount) }}</div>
                <div class="stat-label">评论数</div>
                <div class="stat-trend" v-if="trends.comment">
                  <el-icon :class="{ 'trend-up': trends.comment > 0, 'trend-down': trends.comment < 0 }">
                    <component :is="trends.comment > 0 ? 'ArrowUp' : 'ArrowDown'" />
                  </el-icon>
                  <span>{{ Math.abs(trends.comment) }}%</span>
                </div>
              </div>
            </div>

            <div 
              class="stat-card collects"
              :class="{ 'is-active': selectedStats.collects }"
              @click="toggleStat('collects')"
            >
              <div class="stat-icon">
                <el-icon size="24"><Collection /></el-icon>
              </div>
              <div class="stat-info">
                <div class="stat-value">{{ formatNumber(latestStats.collectCount) }}</div>
                <div class="stat-label">收藏数</div>
                <div class="stat-trend" v-if="trends.collect">
                  <el-icon :class="{ 'trend-up': trends.collect > 0, 'trend-down': trends.collect < 0 }">
                    <component :is="trends.collect > 0 ? 'ArrowUp' : 'ArrowDown'" />
                  </el-icon>
                  <span>{{ Math.abs(trends.collect) }}%</span>
                </div>
              </div>
            </div>

            <div 
              class="stat-card shares"
              :class="{ 'is-active': selectedStats.shares }"
              @click="toggleStat('shares')"
            >
              <div class="stat-icon">
                <el-icon size="24"><Share /></el-icon>
              </div>
              <div class="stat-info">
                <div class="stat-value">{{ formatNumber(latestStats.shareCount) }}</div>
                <div class="stat-label">分享数</div>
                <div class="stat-trend" v-if="trends.share">
                  <el-icon :class="{ 'trend-up': trends.share > 0, 'trend-down': trends.share < 0 }">
                    <component :is="trends.share > 0 ? 'ArrowUp' : 'ArrowDown'" />
                  </el-icon>
                  <span>{{ Math.abs(trends.share) }}%</span>
                </div>
              </div>
            </div>
          </div>

          <!-- 图表区域 -->
          <el-card class="chart-card">
            <template #header>
              <div class="card-header">
                <span class="card-title">数据趋势图</span>
                <div class="chart-legend">
                  <div 
                    class="legend-item"
                    :class="{ 'legend-disabled': !selectedStats.likes }"
                    @click="toggleStat('likes')"
                  >
                    <div class="legend-dot likes-dot"></div>
                    <span>点赞</span>
                  </div>
                  <div 
                    class="legend-item"
                    :class="{ 'legend-disabled': !selectedStats.comments }"
                    @click="toggleStat('comments')"
                  >
                    <div class="legend-dot comments-dot"></div>
                    <span>评论</span>
                  </div>
                  <div 
                    class="legend-item"
                    :class="{ 'legend-disabled': !selectedStats.collects }"
                    @click="toggleStat('collects')"
                  >
                    <div class="legend-dot collects-dot"></div>
                    <span>收藏</span>
                  </div>
                  <div 
                    class="legend-item"
                    :class="{ 'legend-disabled': !selectedStats.shares }"
                    @click="toggleStat('shares')"
                  >
                    <div class="legend-dot shares-dot"></div>
                    <span>分享</span>
                  </div>
                </div>
              </div>
            </template>
            
            <div class="chart-container">
              <v-chart 
                v-if="chartOption" 
                :option="chartOption" 
                style="height: 450px;"
                autoresize
              />
              <div v-else-if="!loading" class="empty-chart">
                <el-empty description="暂无图表数据" />
              </div>
            </div>
          </el-card>
        </div>
      </main>
    </div>
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
import { ref, computed, onMounted, watch } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { useAuthStore } from '@/store/auth'
import { videoApi } from '@/api/video'
import { authApi } from '@/api/auth'
import { ElMessage, ElMessageBox } from 'element-plus'
import {
  ArrowLeft,
  Refresh,
  Headset,
  ArrowUp,
  ArrowDown,
  ChatDotRound,
  Collection,
  Share
} from '@element-plus/icons-vue'
import VChart from 'vue-echarts'
import { use } from 'echarts/core'
import { CanvasRenderer } from 'echarts/renderers'
import { LineChart } from 'echarts/charts'
import {
  TitleComponent,
  TooltipComponent,
  LegendComponent,
  GridComponent
} from 'echarts/components'

use([
  CanvasRenderer,
  LineChart,
  TitleComponent,
  TooltipComponent,
  LegendComponent,
  GridComponent
])

const route = useRoute()
const router = useRouter()
const authStore = useAuthStore()

const loading = ref(false)
const latestStats = ref(null)
const statsDays = ref('7')
const chartOption = ref(null)
const chartData = ref(null) // 存储原始图表数据
const trends = ref({
  digg: 0,
  comment: 0,
  collect: 0,
  share: 0
})

// 统计项选中状态，默认全部选中
const selectedStats = ref({
  likes: true,
  comments: true,
  collects: true,
  shares: true
})

const awemeId = route.params.awemeId

// 更新邮箱对话框状态
const showUpdateEmailDialog = ref(false)
const updateEmailLoading = ref(false)
const emailForm = ref({ email: '' })

const formatNumber = (num) => {
  if (!num) return '0'
  if (num >= 10000) {
    return (num / 10000).toFixed(1) + 'w'
  }
  return num.toString()
}

// 切换统计项选中状态
const toggleStat = (statType) => {
  selectedStats.value[statType] = !selectedStats.value[statType]
  
  // 如果所有统计项都被取消选中，则重新选中当前项
  const allUnselected = Object.values(selectedStats.value).every(selected => !selected)
  if (allUnselected) {
    selectedStats.value[statType] = true
  }
  
  // 重新渲染图表
  if (chartData.value) {
    renderChart(chartData.value)
  }
}

const loadLatestStats = async () => {
  try {
    const response = await videoApi.getLatestVideoStats(awemeId)
    if (response.code === 200) {
      latestStats.value = response.data
    }
  } catch (error) {
    console.error('加载最新统计失败:', error)
  }
}

const loadStatsChart = async () => {
  try {
    const response = await videoApi.getVideoStatsChart(awemeId, statsDays.value)
    if (response.code === 200) {
      chartData.value = response.data
      renderChart(response.data)
    }
  } catch (error) {
    ElMessage.error('加载图表数据失败')
  }
}

const renderChart = (data) => {
  if (!data || !data.timestamps) {
    chartOption.value = null
    return
  }
  
  // 调试日志
  console.log('原始数据:', data)
  console.log('时间戳数据:', data.timestamps)
  console.log('点赞数据:', data.diggCounts)

  // 根据选中状态构建系列数据
  const series = []
  
  if (selectedStats.value.likes) {
    series.push({
      name: '点赞数',
      type: 'line',
      data: (data.diggCounts || []).map((value, index) => [new Date(data.timestamps[index]).getTime(), value]),
      smooth: true,
      symbol: 'circle',
      symbolSize: 6,
      lineStyle: {
        width: 3,
        color: '#ff6b9d'
      },
      itemStyle: {
        color: '#ff6b9d'
      },
      areaStyle: {
        color: {
          type: 'linear',
          x: 0, y: 0, x2: 0, y2: 1,
          colorStops: [
            { offset: 0, color: 'rgba(255, 107, 157, 0.3)' },
            { offset: 1, color: 'rgba(255, 107, 157, 0.05)' }
          ]
        }
      }
    })
  }
  
  if (selectedStats.value.comments) {
    series.push({
      name: '评论数',
      type: 'line',
      data: (data.commentCounts || []).map((value, index) => [new Date(data.timestamps[index]).getTime(), value]),
      smooth: true,
      symbol: 'circle',
      symbolSize: 6,
      lineStyle: {
        width: 3,
        color: '#4ecdc4'
      },
      itemStyle: {
        color: '#4ecdc4'
      }
    })
  }
  
  if (selectedStats.value.collects) {
    series.push({
      name: '收藏数',
      type: 'line',
      data: (data.collectCounts || []).map((value, index) => [new Date(data.timestamps[index]).getTime(), value]),
      smooth: true,
      symbol: 'circle',
      symbolSize: 6,
      lineStyle: {
        width: 3,
        color: '#45b7d1'
      },
      itemStyle: {
        color: '#45b7d1'
      }
    })
  }
  
  if (selectedStats.value.shares) {
    series.push({
      name: '分享数',
      type: 'line',
      data: (data.shareCounts || []).map((value, index) => [new Date(data.timestamps[index]).getTime(), value]),
      smooth: true,
      symbol: 'circle',
      symbolSize: 6,
      lineStyle: {
        width: 3,
        color: '#f9ca24'
      },
      itemStyle: {
        color: '#f9ca24'
      }
    })
  }

  chartOption.value = {
    tooltip: {
      trigger: 'axis',
      axisPointer: {
        type: 'cross'
      },
      backgroundColor: 'rgba(50, 50, 50, 0.95)',
      borderColor: 'transparent',
      textStyle: {
        color: '#fff'
      }
    },
    grid: {
      left: '2%',
      right: '2%',
      bottom: '8%',
      top: '5%',
      containLabel: true
    },
    xAxis: {
      type: 'time',
      axisLine: {
        lineStyle: {
          color: '#e6e8eb'
        }
      },
      axisLabel: {
        color: '#6b7280',
        formatter: (value) => {
          // value 是时间戳，直接使用
          const date = new Date(value)
          const month = (date.getMonth() + 1).toString().padStart(2, '0')
          const day = date.getDate().toString().padStart(2, '0')
          return `${month}-${day}`
        }
      },
      splitLine: {
        show: false
      }
    },
    yAxis: {
      type: 'value',
      axisLine: {
        lineStyle: {
          color: '#e6e8eb'
        }
      },
      axisLabel: {
        color: '#6b7280',
        formatter: (value) => {
          if (value >= 10000) {
            return (value / 10000).toFixed(1) + 'w'
          }
          return value
        }
      },
      splitLine: {
        lineStyle: {
          color: '#f1f3f4',
          type: 'dashed'
        }
      }
    },
    series: series
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
      // 同步更新本地用户信息
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

const loadData = async () => {
  loading.value = true
  try {
    await Promise.all([
      loadLatestStats(),
      loadStatsChart()
    ])
  } finally {
    loading.value = false
  }
}

watch(() => route.params.awemeId, (newAwemeId) => {
  if (newAwemeId) {
    loadData()
  }
})

onMounted(() => {
  loadData()
})
</script>

<style scoped>
.stats-layout {
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

.page-breadcrumb {
  margin-bottom: 16px;
}

.breadcrumb-link {
  color: #409eff;
  cursor: pointer;
}

.breadcrumb-link:hover {
  color: #337ecc;
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
  font-family: 'Consolas', 'Monaco', monospace;
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

.stats-content {
  min-height: 600px;
}

.stats-grid {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(280px, 1fr));
  gap: 20px;
  margin-bottom: 24px;
}

.stat-card {
  background: #fff;
  border-radius: 16px;
  padding: 24px;
  border: 1px solid #e6e8eb;
  display: flex;
  align-items: center;
  gap: 20px;
  transition: all 0.3s ease;
  position: relative;
  overflow: hidden;
  cursor: pointer;
}

.stat-card:hover {
  box-shadow: 0 8px 25px rgba(0, 0, 0, 0.1);
  transform: translateY(-4px);
}

.stat-card.is-active {
  border: 2px solid rgba(99, 102, 241, 0.35);
  box-shadow: 0 6px 16px rgba(99, 102, 241, 0.18);
  transform: translateY(-2px);
}

.stat-card.is-active:hover {
  box-shadow: 0 8px 25px rgba(99, 102, 241, 0.25);
  transform: translateY(-4px);
}

.stat-card::before {
  content: '';
  position: absolute;
  top: 0;
  left: 0;
  right: 0;
  height: 4px;
  background: var(--gradient);
}

.stat-card.likes {
  --gradient: linear-gradient(135deg, #ff6b9d 0%, #e74c8c 100%);
}

.stat-card.comments {
  --gradient: linear-gradient(135deg, #4ecdc4 0%, #44a08d 100%);
}

.stat-card.collects {
  --gradient: linear-gradient(135deg, #45b7d1 0%, #2c5aa0 100%);
}

.stat-card.shares {
  --gradient: linear-gradient(135deg, #f9ca24 0%, #f0932b 100%);
}

.stat-icon {
  width: 64px;
  height: 64px;
  border-radius: 16px;
  display: flex;
  align-items: center;
  justify-content: center;
  background: var(--gradient);
  color: white;
  flex-shrink: 0;
  transition: all 0.3s ease;
}

.stat-card.is-active .stat-icon {
  transform: scale(1.05);
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.2);
}

.stat-info {
  flex: 1;
}

.stat-value {
  font-size: 32px;
  font-weight: 800;
  color: #1f2937;
  line-height: 1.2;
  margin-bottom: 4px;
  transition: color 0.3s ease;
}

.stat-label {
  font-size: 16px;
  color: #6b7280;
  font-weight: 500;
  margin-bottom: 8px;
  transition: color 0.3s ease;
}

.stat-trend {
  display: flex;
  align-items: center;
  gap: 4px;
  font-size: 14px;
  font-weight: 600;
}

.trend-up {
  color: #10b981;
}

.trend-down {
  color: #ef4444;
}



.chart-card {
  border-radius: 16px;
  border: 1px solid #e6e8eb;
  overflow: hidden;
}

.card-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
}

.card-title {
  font-size: 18px;
  font-weight: 600;
  color: #1f2937;
}

.chart-legend {
  display: flex;
  gap: 20px;
  align-items: center;
}

.legend-item {
  display: flex;
  align-items: center;
  gap: 8px;
  font-size: 14px;
  color: #6b7280;
  cursor: pointer;
  padding: 4px 8px;
  border-radius: 6px;
  transition: all 0.2s ease;
}

.legend-item:hover {
  background: rgba(99, 102, 241, 0.1);
  color: #6366f1;
}

.legend-item.legend-disabled {
  opacity: 0.4;
  color: #9ca3af;
}

.legend-item.legend-disabled:hover {
  opacity: 0.6;
  background: rgba(156, 163, 175, 0.1);
}

.legend-dot {
  width: 12px;
  height: 12px;
  border-radius: 50%;
  transition: all 0.2s ease;
}

.likes-dot {
  background: #ff6b9d;
}

.comments-dot {
  background: #4ecdc4;
}

.collects-dot {
  background: #45b7d1;
}

.shares-dot {
  background: #f9ca24;
}

.chart-container {
  padding: 20px 0;
}

.empty-chart {
  height: 450px;
  display: flex;
  align-items: center;
  justify-content: center;
}

:deep(.el-card__header) {
  padding: 24px 32px;
  border-bottom: 1px solid #f0f0f0;
  background: #fafbfc;
}

:deep(.el-card__body) {
  padding: 24px 32px;
}

:deep(.el-breadcrumb__item:last-child .el-breadcrumb__inner) {
  color: #6b7280;
  font-weight: 500;
}

:deep(.el-breadcrumb__item:not(:last-child) .el-breadcrumb__inner:hover) {
  color: #337ecc;
}

.heart-icon-large {
  display: flex;
  align-items: center;
  justify-content: center;
  color: #ffffff; /* 白色心型，在红色背景上更突出 */
  filter: drop-shadow(0 1px 2px rgba(0, 0, 0, 0.1)); /* 添加轻微阴影增强对比度 */
}
</style>