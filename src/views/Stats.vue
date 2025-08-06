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
          :default-active="'/dashboard'"
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
        </el-menu>
      </nav>

      <!-- 主内容区 -->
      <main class="content">
        <!-- 页面头部 -->
        <div class="page-header">
          <div class="page-breadcrumb">
            <el-breadcrumb separator="/">
              <el-breadcrumb-item @click="$router.push('/dashboard')" class="breadcrumb-link">
                数据概览
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
            <div class="stat-card likes">
              <div class="stat-icon">
                <el-icon size="24"><Star /></el-icon>
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

            <div class="stat-card comments">
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

            <div class="stat-card collects">
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

            <div class="stat-card shares">
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
                  <div class="legend-item">
                    <div class="legend-dot likes-dot"></div>
                    <span>点赞</span>
                  </div>
                  <div class="legend-item">
                    <div class="legend-dot comments-dot"></div>
                    <span>评论</span>
                  </div>
                  <div class="legend-item">
                    <div class="legend-dot collects-dot"></div>
                    <span>收藏</span>
                  </div>
                  <div class="legend-item">
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
  </div>
</template>

<script setup>
import { ref, computed, onMounted, watch } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { useAuthStore } from '@/store/auth'
import { videoApi } from '@/api/video'
import { ElMessage, ElMessageBox } from 'element-plus'
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
const trends = ref({
  digg: 0,
  comment: 0,
  collect: 0,
  share: 0
})

const awemeId = route.params.awemeId

const formatNumber = (num) => {
  if (!num) return '0'
  if (num >= 10000) {
    return (num / 10000).toFixed(1) + 'w'
  }
  return num.toString()
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
      type: 'category',
      data: data.timestamps,
      axisLine: {
        lineStyle: {
          color: '#e6e8eb'
        }
      },
      axisLabel: {
        color: '#6b7280'
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
    series: [
      {
        name: '点赞数',
        type: 'line',
        data: data.diggCounts || [],
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
      },
      {
        name: '评论数',
        type: 'line',
        data: data.commentCounts || [],
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
      },
      {
        name: '收藏数',
        type: 'line',
        data: data.collectCounts || [],
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
      },
      {
        name: '分享数',
        type: 'line',
        data: data.shareCounts || [],
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
      }
    ]
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
}

.stat-card:hover {
  box-shadow: 0 8px 25px rgba(0, 0, 0, 0.1);
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
  --gradient: linear-gradient(135deg, #ff6b9d 0%, #c44569 100%);
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
}

.stat-label {
  font-size: 16px;
  color: #6b7280;
  font-weight: 500;
  margin-bottom: 8px;
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
}

.legend-dot {
  width: 12px;
  height: 12px;
  border-radius: 50%;
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
</style>