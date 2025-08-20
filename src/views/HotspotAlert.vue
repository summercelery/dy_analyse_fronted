<template>
  <div class="hotspot-layout">
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
            <div class="page-title-section">
              <h2 class="page-title">
                {{ currentMusicInfo.title }}
                <span class="music-meta"> · {{ currentMusicInfo.author }}</span>
              </h2>
              <p class="page-meta">热度提醒 · 实时监控视频热度变化</p>
            </div>
          </template>
          <template v-else>
            <h2 class="page-title">全局热度提醒</h2>
            <p class="page-desc">监控所有音乐的视频热度变化，及时发现爆火趋势</p>
          </template>
        </div>

        <!-- 统计卡片 -->
        <div v-if="currentMusicId" class="stats-row">
          <div class="stat-card total" :class="{ 'is-active': currentFilter === 'all' }" @click="filterAlerts('all')">
            <div class="stat-icon">
              <el-icon size="20"><Bell /></el-icon>
            </div>
            <div class="stat-info">
              <div class="stat-value">{{ statistics.totalCount }}</div>
              <div class="stat-label">总提醒数</div>
            </div>
          </div>
          
          <div class="stat-card level1" :class="{ 'is-active': currentFilter === 'level1' }" @click="filterAlerts('level1')">
            <div class="stat-icon">
              <el-icon size="20"><Warning /></el-icon>
            </div>
            <div class="stat-info">
              <div class="stat-value">{{ statistics.level1Count }}</div>
              <div class="stat-label">轻度飙升</div>
            </div>
          </div>
          
          <div class="stat-card level2" :class="{ 'is-active': currentFilter === 'level2' }" @click="filterAlerts('level2')">
            <div class="stat-icon">
              <el-icon size="20"><Warning /></el-icon>
            </div>
            <div class="stat-info">
              <div class="stat-value">{{ statistics.level2Count }}</div>
              <div class="stat-label">中度飙升</div>
            </div>
          </div>
          
          <div class="stat-card level3" :class="{ 'is-active': currentFilter === 'level3' }" @click="filterAlerts('level3')">
            <div class="stat-icon">
              <el-icon size="20"><Warning /></el-icon>
            </div>
            <div class="stat-info">
              <div class="stat-value">{{ statistics.level3Count }}</div>
              <div class="stat-label">高度爆发</div>
            </div>
          </div>
        </div>

        <!-- 筛选和操作栏 -->
        <div class="section-divider"></div>
        <div class="toolbar">
          <div class="toolbar-left">
            <el-button v-if="currentMusicId" @click="goBackFromMusic" :icon="ArrowLeft">
              返回音乐管理
            </el-button>
            <el-button v-else @click="router.push('/music')" :icon="ArrowLeft">
              选择音乐
            </el-button>
            <el-button @click="() => loadHotspotAlerts()" :loading="loading" :icon="Refresh">
              刷新
            </el-button>
            <el-button type="primary" @click="triggerDetection" :loading="triggeringDetection" :icon="MagicStick">
              手动检测
            </el-button>
          </div>
          <div class="toolbar-right">
            <el-select
              v-model="alertLevel"
              placeholder="提醒级别"
              style="width: 120px; margin-right: 12px;"
              @change="handleFilterChange"
              clearable
            >
              <el-option label="轻度飙升" :value="1" />
              <el-option label="中度飙升" :value="2" />
              <el-option label="高度爆发" :value="3" />
            </el-select>
            <el-select
              v-model="timeWindow"
              placeholder="时间窗口"
              style="width: 120px; margin-right: 12px;"
              @change="handleFilterChange"
              clearable
            >
              <el-option label="短期(1小时)" value="short" />
              <el-option label="中期(6小时)" value="medium" />
              <el-option label="长期(24小时)" value="long" />
            </el-select>
            <el-select
              v-model="triggerMetric"
              placeholder="触发指标"
              style="width: 120px; margin-right: 12px;"
              @change="handleFilterChange"
              clearable
            >
              <el-option label="点赞" value="digg" />
              <el-option label="评论" value="comment" />
              <el-option label="收藏" value="collect" />
              <el-option label="分享" value="share" />
              <el-option label="综合" value="comprehensive" />
            </el-select>
            <el-date-picker
              v-model="startTime"
              type="date"
              placeholder="开始日期"
              format="YYYY-MM-DD"
              value-format="YYYY-MM-DD"
              style="width: 140px; margin-right: 8px;"
              @change="handleFilterChange"
            />
            <el-date-picker
              v-model="endTime"
              type="date"
              placeholder="结束日期"
              format="YYYY-MM-DD"
              value-format="YYYY-MM-DD"
              style="width: 140px; margin-right: 12px;"
              @change="handleFilterChange"
            />
            <el-input
              v-model="searchKeyword"
              placeholder="搜索视频ID或标题"
              :prefix-icon="Search"
              style="width: 300px;"
              clearable
              @keyup.enter="handleSearch"
              @clear="handleSearch"
            />
            <el-button @click="handleSearch" :icon="Search" style="margin-left: 8px;">搜索</el-button>
          </div>
        </div>

        <!-- 热度提醒列表 -->
        <el-card class="hotspot-table-card">
          <template #header>
            <div class="card-header">
              <span class="card-title">热度提醒列表</span>
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
          
          <!-- 全局热度提醒说明 -->
          <div v-if="!currentMusicId" class="global-alert-info">
            <el-alert
              title="全局热度提醒"
              description="当前显示所有音乐的热度提醒数据，您可以选择具体音乐查看更详细的信息"
              type="info"
              :closable="false"
              style="margin-bottom: 16px;"
            />
          </div>
          
          <div v-loading="loading">
            <el-table 
              :data="groupedHotspotList" 
              style="width: 100%"
              @selection-change="handleSelectionChange"
              :empty-text="groupedHotspotList.length === 0 ? '暂无热度提醒数据' : ''"
              size="default"
              :cell-style="{ padding: '8px 6px' }"
              :header-cell-style="{ padding: '8px 6px', background: '#fafafa' }"
            >
              <el-table-column type="selection" width="50" />
              
              <el-table-column type="expand" width="50">
                <template #default="{ row }">
                  <div class="expand-content">
                    <el-table :data="row.alerts" size="small" class="expand-table" stripe>
                      <el-table-column label="检测时间" min-width="160" align="center">
                        <template #default="{ row: alert }">
                          <span class="time-text">{{ formatDate(alert.detectionTime) }}</span>
                        </template>
                      </el-table-column>
                      
                      <el-table-column label="提醒级别" width="110" align="center">
                        <template #default="{ row: alert }">
                          <el-tag :type="getAlertLevelType(alert.alertLevel)" size="small">
                            {{ getAlertLevelText(alert.alertLevel) }}
                          </el-tag>
                        </template>
                      </el-table-column>
                      
                      <el-table-column label="时间窗口" width="110" align="center">
                        <template #default="{ row: alert }">
                          <el-tag :type="getTimeWindowType(alert.timeWindow)" size="small">
                            {{ getTimeWindowText(alert.timeWindow) }}
                          </el-tag>
                        </template>
                      </el-table-column>
                      
                      <el-table-column label="触发指标" width="110" align="center">
                        <template #default="{ row: alert }">
                          <el-tag size="small" type="info">
                            {{ getTriggerMetricText(alert.triggerMetric) }}
                          </el-tag>
                        </template>
                      </el-table-column>
                      
                      <el-table-column label="增长率" width="120" align="center">
                        <template #default="{ row: alert }">
                          <span :class="getGrowthRateClass(alert.growthRate)" class="growth-text">
                            +{{ formatGrowthRate(alert.growthRate) }}%
                          </span>
                        </template>
                      </el-table-column>
                      
                      <el-table-column label="当前点赞" width="120" align="center">
                        <template #default="{ row: alert }">
                          <span class="stat-number">{{ formatNumber(alert.currentDiggCount || 0) }}</span>
                        </template>
                      </el-table-column>
                      
                      <el-table-column label="当前评论" width="120" align="center">
                        <template #default="{ row: alert }">
                          <span class="stat-number">{{ formatNumber(alert.currentCommentCount || 0) }}</span>
                        </template>
                      </el-table-column>
                      
                      <el-table-column label="操作" width="100" align="center" fixed="right">
                        <template #default="{ row: alert }">
                          <div class="expand-actions">
                            <el-tooltip content="查看详情" placement="top">
                              <el-button 
                                size="small" 
                                type="primary" 
                                link 
                                :icon="View"
                                @click="viewAlertDetail(alert)"
                              />
                            </el-tooltip>
                            <el-tooltip content="删除" placement="top">
                              <el-button 
                                size="small" 
                                type="danger" 
                                link 
                                :icon="Delete"
                                @click="deleteAlert(alert)"
                              />
                            </el-tooltip>
                          </div>
                        </template>
                      </el-table-column>
                    </el-table>
                  </div>
                </template>
              </el-table-column>
              
              <el-table-column label="视频ID" width="140">
                <template #default="{ row }">
                  <div class="video-id">
                    <el-link 
                      v-if="row.awemeId"
                      :href="`https://www.douyin.com/video/${row.awemeId}`" 
                      target="_blank"
                      type="primary"
                      class="video-id-link"
                    >
                      {{ row.awemeId }}
                    </el-link>
                    <span v-else>{{ row.awemeId || 'N/A' }}</span>
                  </div>
                </template>
              </el-table-column>
              
              <el-table-column label="视频标题" width="200">
                <template #default="{ row }">
                  <div class="video-title">
                    <el-tooltip 
                      v-if="row.videoTitle"
                      :content="row.videoTitle"
                      placement="top"
                      :show-after="500"
                    >
                      <span class="title-text">{{ row.videoTitle }}</span>
                    </el-tooltip>
                    <span v-else class="na-text">无标题</span>
                  </div>
                </template>
              </el-table-column>
              
              <el-table-column label="播主" width="120">
                <template #default="{ row }">
                  <div class="author-name">
                    <span class="author-nickname">{{ row.authorNickname || 'N/A' }}</span>
                  </div>
                </template>
              </el-table-column>
              
              <!-- 全局模式下显示音乐信息 -->
              <el-table-column v-if="!currentMusicId" label="音乐信息" width="180">
                <template #default="{ row }">
                  <div class="music-info">
                    <div v-if="row.musicTitle" class="music-title">
                      {{ row.musicTitle }}
                    </div>
                    <div v-if="row.musicAuthor" class="music-author">
                      {{ row.musicAuthor }}
                    </div>
                    <span v-if="!row.musicTitle && !row.musicAuthor" class="na-text">音乐信息不详</span>
                  </div>
                </template>
              </el-table-column>
              
              <el-table-column label="提醒统计" width="180" align="center">
                <template #default="{ row }">
                  <div class="alert-stats">
                    <div class="total-alerts">共 {{ row.totalAlerts }} 条提醒</div>
                    <div class="level-stats">
                      <el-tag v-if="row.level1Count > 0" type="success" size="small">轻度{{ row.level1Count }}</el-tag>
                      <el-tag v-if="row.level2Count > 0" type="warning" size="small">中度{{ row.level2Count }}</el-tag>
                      <el-tag v-if="row.level3Count > 0" type="danger" size="small">高度{{ row.level3Count }}</el-tag>
                    </div>
                  </div>
                </template>
              </el-table-column>
              
              <el-table-column label="最高增长率" width="120" align="center">
                <template #default="{ row }">
                  <div class="growth-rate">
                    <span :class="getGrowthRateClass(row.maxGrowthRate)">
                      +{{ formatGrowthRate(row.maxGrowthRate) }}%
                    </span>
                  </div>
                </template>
              </el-table-column>
              
              <el-table-column label="当前数据" width="150">
                <template #default="{ row }">
                  <div class="current-stats">
                    <div class="stats-item">
                      <div class="heart-icon">
                        <svg width="14" height="14" viewBox="0 0 24 24" fill="currentColor">
                          <path d="M12 21.35l-1.45-1.32C5.4 15.36 2 12.28 2 8.5 2 5.42 4.42 3 7.5 3c1.74 0 3.41.81 4.5 2.09C13.09 3.81 14.76 3 16.5 3 19.58 3 22 5.42 22 8.5c0 3.78-3.4 6.86-8.55 11.54L12 21.35z"/>
                        </svg>
                      </div>
                      <span>{{ formatNumber(row.currentDiggCount || 0) }}</span>
                    </div>
                    <div class="stats-item">
                      <el-icon><ChatDotRound /></el-icon>
                      <span>{{ formatNumber(row.currentCommentCount || 0) }}</span>
                    </div>
                  </div>
                </template>
              </el-table-column>
              
              <el-table-column label="最新检测时间" width="150" align="center">
                <template #default="{ row }">
                  <div class="detection-time">
                    {{ formatDate(row.latestDetectionTime) }}
                  </div>
                </template>
              </el-table-column>
              
              <el-table-column label="操作" width="120" fixed="right">
                <template #default="{ row }">
                  <div class="table-actions">
                    <el-tooltip content="查看统计" placement="top">
                      <el-button 
                        type="primary" 
                        size="small" 
                        :icon="DataAnalysis"
                        @click="viewStats(row.awemeId)"
                        link
                      />
                    </el-tooltip>
                    
                    <el-tooltip content="查看详情" placement="top">
                      <el-button 
                        type="primary" 
                        size="small" 
                        :icon="View"
                        @click="viewAlertDetail(row.latestAlert)"
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

    <!-- 批量操作对话框 -->
    <el-dialog
      v-model="showBatchDialog"
      title="批量操作"
      width="400px"
    >
      <p>已选择 {{ selectedRows.length }} 个热度提醒</p>
      
      <template #footer>
        <el-button @click="showBatchDialog = false">取消</el-button>
        <el-button type="danger" @click="batchDelete">
          批量删除
        </el-button>
      </template>
    </el-dialog>

    <!-- 提醒详情对话框 -->
    <el-dialog
      v-model="showDetailDialog"
      title="热度提醒详情"
      width="800px"
    >
      <div v-if="currentAlert" class="alert-detail">
        <div class="detail-section">
          <h4>基本信息</h4>
          <el-descriptions :column="2" border>
            <el-descriptions-item label="视频ID">{{ currentAlert.awemeId }}</el-descriptions-item>
            <el-descriptions-item label="视频标题">{{ currentAlert.videoTitle || 'N/A' }}</el-descriptions-item>
            <el-descriptions-item label="播主昵称">{{ currentAlert.authorNickname || 'N/A' }}</el-descriptions-item>
            <el-descriptions-item label="提醒级别">
              <el-tag :type="getAlertLevelType(currentAlert.alertLevel)" size="small">
                {{ getAlertLevelText(currentAlert.alertLevel) }}
              </el-tag>
            </el-descriptions-item>
            <el-descriptions-item label="时间窗口">{{ getTimeWindowText(currentAlert.timeWindow) }}</el-descriptions-item>
            <el-descriptions-item label="触发指标">{{ getTriggerMetricText(currentAlert.triggerMetric) }}</el-descriptions-item>
          </el-descriptions>
        </div>
        
        <div class="detail-section">
          <h4>增长数据</h4>
          <el-descriptions :column="2" border>
            <el-descriptions-item label="点赞增长率">+{{ formatGrowthRate(currentAlert.diggGrowthRate) }}%</el-descriptions-item>
            <el-descriptions-item label="评论增长率">+{{ formatGrowthRate(currentAlert.commentGrowthRate) }}%</el-descriptions-item>
            <el-descriptions-item label="收藏增长率">+{{ formatGrowthRate(currentAlert.collectGrowthRate) }}%</el-descriptions-item>
            <el-descriptions-item label="分享增长率">+{{ formatGrowthRate(currentAlert.shareGrowthRate) }}%</el-descriptions-item>
            <el-descriptions-item label="综合指数">{{ formatGrowthRate(currentAlert.comprehensiveIndex) }}</el-descriptions-item>
            <el-descriptions-item label="主要增长率">+{{ formatGrowthRate(currentAlert.growthRate) }}%</el-descriptions-item>
          </el-descriptions>
        </div>
        
        <div class="detail-section">
          <h4>当前数据 vs 基准数据</h4>
          <el-descriptions :column="4" border>
            <el-descriptions-item label="当前点赞">{{ formatNumber(currentAlert.currentDiggCount) }}</el-descriptions-item>
            <el-descriptions-item label="基准点赞">{{ formatNumber(currentAlert.baselineDiggCount) }}</el-descriptions-item>
            <el-descriptions-item label="当前评论">{{ formatNumber(currentAlert.currentCommentCount) }}</el-descriptions-item>
            <el-descriptions-item label="基准评论">{{ formatNumber(currentAlert.baselineCommentCount) }}</el-descriptions-item>
            <el-descriptions-item label="当前收藏">{{ formatNumber(currentAlert.currentCollectCount) }}</el-descriptions-item>
            <el-descriptions-item label="基准收藏">{{ formatNumber(currentAlert.baselineCollectCount) }}</el-descriptions-item>
            <el-descriptions-item label="当前分享">{{ formatNumber(currentAlert.currentShareCount) }}</el-descriptions-item>
            <el-descriptions-item label="基准分享">{{ formatNumber(currentAlert.baselineShareCount) }}</el-descriptions-item>
          </el-descriptions>
        </div>
        
        <div class="detail-section">
          <h4>时间信息</h4>
          <el-descriptions :column="2" border>
            <el-descriptions-item label="检测时间">{{ formatDate(currentAlert.detectionTime) }}</el-descriptions-item>
            <el-descriptions-item label="基准时间">{{ formatDate(currentAlert.baselineTime) }}</el-descriptions-item>
            <el-descriptions-item label="创建时间">{{ formatDate(currentAlert.createTime) }}</el-descriptions-item>
            <el-descriptions-item label="时间窗口">{{ currentAlert.timeWindowHours }}小时</el-descriptions-item>
          </el-descriptions>
        </div>
      </div>
      
      <template #footer>
        <el-button @click="showDetailDialog = false">关闭</el-button>
        <el-button type="primary" @click="viewVideo(currentAlert?.awemeId)">查看视频</el-button>
      </template>
    </el-dialog>
  </div>
</template>

<script setup>
import { ref, computed, onMounted, onUnmounted } from 'vue'
import { useRouter, useRoute } from 'vue-router'
import { useAuthStore } from '@/store/auth'
import { hotspotApi } from '@/api/hotspot'
import { musicApi } from '@/api/music'
import { authApi } from '@/api/auth'
import { ElMessage, ElMessageBox } from 'element-plus'
import {
  ArrowDown,
  ArrowLeft,
  Headset,
  TrendCharts,
  Bell,
  Warning,
  Refresh,
  MagicStick,
  Search,
  View,
  Delete,
  ChatDotRound,
  DataAnalysis
} from '@element-plus/icons-vue'

const route = useRoute()
const router = useRouter()
const authStore = useAuthStore()

const loading = ref(false)
const triggeringDetection = ref(false)
const hotspotList = ref([])
const groupedHotspotList = ref([])
const selectedRows = ref([])
const currentMusicId = ref(null)
const currentMusicInfo = ref(null)
const currentFilter = ref('all')

// 筛选条件
const alertLevel = ref(null)
const timeWindow = ref('')
const triggerMetric = ref('')
const searchKeyword = ref('')
const startTime = ref('')
const endTime = ref('')


// 统计数据
const statistics = ref({
  totalCount: 0,
  level1Count: 0,
  level2Count: 0,
  level3Count: 0,
  todayCount: 0,
  weekCount: 0,
  monthCount: 0
})

// 对话框
const showBatchDialog = ref(false)
const showDetailDialog = ref(false)
const currentAlert = ref(null)

// 提醒级别映射
const getAlertLevelType = (level) => {
  switch (level) {
    case 1: return 'success'
    case 2: return 'warning'
    case 3: return 'danger'
    default: return 'info'
  }
}

const getAlertLevelText = (level) => {
  switch (level) {
    case 1: return '轻度飙升'
    case 2: return '中度飙升'
    case 3: return '高度爆发'
    default: return '未知'
  }
}

// 时间窗口映射
const getTimeWindowType = (window) => {
  switch (window) {
    case 'short': return 'success'
    case 'medium': return 'warning'
    case 'long': return 'danger'
    default: return 'info'
  }
}

const getTimeWindowText = (window) => {
  switch (window) {
    case 'short': return '短期'
    case 'medium': return '中期'
    case 'long': return '长期'
    default: return '未知'
  }
}

// 触发指标映射
const getTriggerMetricText = (metric) => {
  switch (metric) {
    case 'digg': return '点赞'
    case 'comment': return '评论'
    case 'collect': return '收藏'
    case 'share': return '分享'
    case 'comprehensive': return '综合'
    default: return '未知'
  }
}

// 增长率样式
const getGrowthRateClass = (rate) => {
  if (rate >= 100) return 'growth-high'
  if (rate >= 50) return 'growth-medium'
  return 'growth-low'
}

const formatNumber = (num) => {
  if (!num) return '0'
  if (num >= 10000) {
    return (num / 10000).toFixed(1) + 'w'
  }
  return num.toString()
}

const formatGrowthRate = (rate) => {
  if (!rate) return '0'
  return Math.round(rate * 100) / 100
}

const formatDate = (dateStr) => {
  if (!dateStr) return 'N/A'
  return new Date(dateStr).toLocaleString('zh-CN')
}

// 按视频ID分组热度提醒数据
const groupHotspotData = (data) => {
  const grouped = {}
  
  data.forEach(item => {
    const awemeId = item.awemeId
    if (!grouped[awemeId]) {
      grouped[awemeId] = {
        awemeId: awemeId,
        videoTitle: item.videoTitle,
        authorNickname: item.authorNickname,
        musicTitle: item.musicTitle,
        musicAuthor: item.musicAuthor,
        totalAlerts: 0,
        latestAlert: null,
        alerts: [],
        // 统计不同级别的提醒数量
        level1Count: 0,
        level2Count: 0,
        level3Count: 0,
        // 最高增长率和当前数据（取最新的）
        maxGrowthRate: 0,
        currentDiggCount: 0,
        currentCommentCount: 0,
        latestDetectionTime: null
      }
    }
    
    const group = grouped[awemeId]
    group.alerts.push(item)
    group.totalAlerts++
    
    // 统计不同级别
    if (item.alertLevel === 1) group.level1Count++
    else if (item.alertLevel === 2) group.level2Count++
    else if (item.alertLevel === 3) group.level3Count++
    
    // 更新最高增长率
    if (item.growthRate > group.maxGrowthRate) {
      group.maxGrowthRate = item.growthRate
    }
    
    // 更新最新的提醒（用于显示最新数据）
    if (!group.latestAlert || new Date(item.detectionTime) > new Date(group.latestAlert.detectionTime)) {
      group.latestAlert = item
      group.currentDiggCount = item.currentDiggCount
      group.currentCommentCount = item.currentCommentCount
      group.latestDetectionTime = item.detectionTime
    }
  })
  
  // 将分组后的数据转换为数组，并按最新检测时间排序
  return Object.values(grouped).sort((a, b) => 
    new Date(b.latestDetectionTime) - new Date(a.latestDetectionTime)
  )
}



// 搜索处理函数
const handleSearch = () => {
  loadHotspotAlerts()
}

// 筛选处理函数
const handleFilterChange = () => {
  loadHotspotAlerts()
}

// 加载统计数据
const loadStatistics = async () => {
  try {
    let response
    if (currentMusicId.value) {
      // 获取音乐维度的统计
      response = await hotspotApi.getMusicStatistics(currentMusicId.value)
    } else {
      // 获取全局统计
      response = await hotspotApi.getGlobalStatistics()
    }
    
    if (response.code === 200) {
      statistics.value = response.data
    }
  } catch (error) {
    console.error('加载统计数据失败:', error)
  }
}

// 加载全局热度提醒列表
const loadGlobalHotspotAlerts = async () => {
  try {
    const params = {
      orderBy: 'create_time',
      orderDir: 'DESC'
    }
    
    // 添加筛选条件
    if (alertLevel.value) {
      params.alertLevel = alertLevel.value
    }
    if (timeWindow.value) {
      params.timeWindow = timeWindow.value
    }
    if (triggerMetric.value) {
      params.triggerMetric = triggerMetric.value
    }
    if (searchKeyword.value) {
      params.awemeId = searchKeyword.value.trim()
    }
    if (startTime.value) {
      params.startTime = startTime.value + 'T00:00:00'
    }
    if (endTime.value) {
      params.endTime = endTime.value + 'T23:59:59'
    }
    
    const response = await hotspotApi.getAlertList(params)
    
    if (response.code === 200) {
      const responseData = response.data || {}
      hotspotList.value = responseData.list || responseData || []
      
      // 按视频ID分组数据
      groupedHotspotList.value = groupHotspotData(hotspotList.value)
      
      console.log('全局热度提醒API响应:', responseData)
      console.log('分组后的数据:', groupedHotspotList.value)
      
      // 加载统计数据
      await loadStatistics()
    } else {
      ElMessage.error(response.message || '加载全局热度提醒列表失败')
    }
  } catch (error) {
    console.error('加载全局热度提醒列表失败:', error)
    ElMessage.error('加载全局热度提醒列表失败')
  } finally {
    loading.value = false
  }
}

// 筛选提醒
const filterAlerts = (filterType) => {
  currentFilter.value = filterType
  
  // 根据筛选类型设置alertLevel
  switch (filterType) {
    case 'level1':
      alertLevel.value = 1
      break
    case 'level2':
      alertLevel.value = 2
      break
    case 'level3':
      alertLevel.value = 3
      break
    default:
      alertLevel.value = null
      break
  }
  
  loadHotspotAlerts()
}

// 加载热度提醒列表
const loadHotspotAlerts = async () => {
  loading.value = true
  
  // 如果没有音乐ID，查询全局热度提醒
  if (!currentMusicId.value) {
    await loadGlobalHotspotAlerts()
    return
  }
  
  try {
    const params = {
      orderBy: 'create_time',
      orderDir: 'DESC'
    }
    
    // 添加筛选条件
    if (alertLevel.value) {
      params.alertLevel = alertLevel.value
    }
    if (timeWindow.value) {
      params.timeWindow = timeWindow.value
    }
    if (triggerMetric.value) {
      params.triggerMetric = triggerMetric.value
    }
    if (searchKeyword.value) {
      params.awemeId = searchKeyword.value.trim()
    }
    if (startTime.value) {
      params.startTime = startTime.value + 'T00:00:00'
    }
    if (endTime.value) {
      params.endTime = endTime.value + 'T23:59:59'
    }
    
    const response = await hotspotApi.getMusicAlertList(currentMusicId.value, params)
    
    if (response.code === 200) {
      const responseData = response.data || {}
      hotspotList.value = responseData.list || responseData || []
      
      // 按视频ID分组数据
      groupedHotspotList.value = groupHotspotData(hotspotList.value)
      
      console.log('热度提醒API响应:', responseData)
      console.log('分组后的数据:', groupedHotspotList.value)
      
      // 加载统计数据
      await loadStatistics()
    } else {
      ElMessage.error(response.message || '加载热度提醒列表失败')
    }
  } catch (error) {
    console.error('加载热度提醒列表失败:', error)
    ElMessage.error('加载热度提醒列表失败')
  } finally {
    loading.value = false
  }
}

// 手动触发检测
const triggerDetection = async () => {
  triggeringDetection.value = true
  try {
    const response = await hotspotApi.triggerDetection()
    if (response.code === 200) {
      ElMessage.success('检测已触发，请稍后查看结果')
      setTimeout(() => {
        loadHotspotAlerts()
      }, 3000)
    } else {
      ElMessage.error(response.message || '触发检测失败')
    }
  } catch (error) {
    ElMessage.error('触发检测失败')
  } finally {
    triggeringDetection.value = false
  }
}

// 查看视频统计
const viewStats = (awemeId) => {
  if (awemeId) {
    // 保存当前页面状态到URL参数中
    const currentQuery = {
      ...route.query,
      // 保存筛选和搜索状态
      searchKeyword: searchKeyword.value || undefined,
      alertLevel: alertLevel.value || undefined,
      timeWindow: timeWindow.value || undefined,
      triggerMetric: triggerMetric.value || undefined,
      startTime: startTime.value || undefined,
      endTime: endTime.value || undefined,
      currentFilter: currentFilter.value !== 'all' ? currentFilter.value : undefined
    }
    
    // 移除undefined值
    Object.keys(currentQuery).forEach(key => {
      if (currentQuery[key] === undefined) {
        delete currentQuery[key]
      }
    })
    
    // 使用replace更新当前路由的query参数，这样返回时能恢复状态
    router.replace({ path: route.path, query: currentQuery }).then(() => {
      // 然后跳转到统计页面
      router.push(`/stats/${awemeId}`)
    })
  } else {
    ElMessage.warning('视频ID无效')
  }
}

// 查看提醒详情
const viewAlertDetail = (row) => {
  currentAlert.value = row
  showDetailDialog.value = true
}

// 查看视频
const viewVideo = (awemeId) => {
  if (awemeId) {
    window.open(`https://www.douyin.com/video/${awemeId}`, '_blank')
  }
}

// 删除提醒
const deleteAlert = async (row) => {
  try {
    await ElMessageBox.confirm('确认删除该热度提醒？', '警告', {
      type: 'warning',
      confirmButtonText: '确认删除',
      cancelButtonText: '取消'
    })
    
    const response = await hotspotApi.deleteAlert(row.id)
    if (response.code === 200) {
      ElMessage.success('删除成功')
      await loadHotspotAlerts()
      await loadStatistics()
    } else {
      ElMessage.error(response.message || '删除失败')
    }
  } catch (error) {
    if (error !== 'cancel') {
      ElMessage.error('删除失败')
    }
  }
}

// 表格选择处理
const handleSelectionChange = (selection) => {
  selectedRows.value = selection
}

// 批量删除
const batchDelete = async () => {
  try {
    await ElMessageBox.confirm(`确认批量删除选中的 ${selectedRows.value.length} 个热度提醒？`, '警告', {
      type: 'warning',
      confirmButtonText: '确认删除',
      cancelButtonText: '取消'
    })
    
    const ids = selectedRows.value.map(row => row.id)
    const response = await hotspotApi.batchDeleteAlerts(ids)
    if (response.code === 200) {
      ElMessage.success('批量删除成功')
      showBatchDialog.value = false
      selectedRows.value = []
      await loadHotspotAlerts()
      await loadStatistics()
    } else {
      ElMessage.error(response.message || '批量删除失败')
    }
  } catch (error) {
    if (error !== 'cancel') {
      ElMessage.error('批量删除失败')
    }
  }
}

// 头部操作
const handleCommand = async (command) => {
  if (command === 'updateEmail') {
    // 更新邮箱逻辑
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

const goBackFromMusic = () => {
  router.push('/music')
}

// 初始化默认日期（当天）
const initDefaultDate = () => {
  const today = new Date()
  const todayStr = today.toISOString().split('T')[0]
  
  // 如果没有从URL恢复日期参数，则设置为当天
  if (!route.query.startTime && !route.query.endTime) {
    startTime.value = todayStr
    endTime.value = todayStr
  }
}

onMounted(async () => {
  // 初始化默认日期
  initDefaultDate()
  
  // 检查是否有音乐ID查询参数
  if (route.query.musicId) {
    currentMusicId.value = parseInt(route.query.musicId)
    // 获取音乐信息
    try {
      const res = await musicApi.getMusicById(currentMusicId.value)
      if (res?.code === 200) {
        currentMusicInfo.value = res.data
      }
    } catch (error) {
      console.warn('获取音乐信息失败:', error)
    }
    
    await loadStatistics()
  }
  
  // 恢复保存的页面状态
  if (route.query.searchKeyword) {
    searchKeyword.value = route.query.searchKeyword
  }
  if (route.query.alertLevel) {
    alertLevel.value = parseInt(route.query.alertLevel)
  }
  if (route.query.timeWindow) {
    timeWindow.value = route.query.timeWindow
  }
  if (route.query.triggerMetric) {
    triggerMetric.value = route.query.triggerMetric
  }
  if (route.query.currentFilter) {
    currentFilter.value = route.query.currentFilter
  }
  if (route.query.startTime) {
    startTime.value = route.query.startTime
  }
  if (route.query.endTime) {
    endTime.value = route.query.endTime
  }
  
  await loadHotspotAlerts()
})
</script>

<style scoped>
.hotspot-layout {
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
  padding: 20px 0;
  border-bottom: 1px solid #e6e8eb;
}

.page-title {
  margin: 0 0 8px 0;
  font-size: 24px;
  font-weight: 600;
  color: #1a1a1a;
  line-height: 1.4;
}

.music-meta {
  font-size: 18px;
  color: #6b7280;
  font-weight: 500;
}

.page-meta, .page-desc {
  margin: 0;
  color: #666;
  font-size: 14px;
  line-height: 1.6;
}

.stats-row {
  display: grid;
  grid-template-columns: repeat(4, 1fr);
  gap: 18px;
  margin: 20px 0 16px;
}

.stat-card {
  background: #fff;
  border-radius: 12px;
  padding: 20px;
  border: 1px solid #e6e8eb;
  display: flex;
  align-items: center;
  gap: 16px;
  transition: all 0.3s ease;
  cursor: pointer;
}

.stat-card:hover {
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.1);
  transform: translateY(-2px);
}

.stat-card.total .stat-icon {
  background: linear-gradient(135deg, #6366f1 0%, #8b8df5 100%);
  color: #fff;
}

.stat-card.level1 .stat-icon {
  background: linear-gradient(135deg, #10b981 0%, #34d399 100%);
  color: #fff;
}

.stat-card.level2 .stat-icon {
  background: linear-gradient(135deg, #f59e0b 0%, #fbbf24 100%);
  color: #fff;
}

.stat-card.level3 .stat-icon {
  background: linear-gradient(135deg, #ef4444 0%, #f87171 100%);
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

.section-divider {
  height: 1px;
  background: #eceff5;
  margin: 4px 0 10px;
}

.toolbar {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 12px;
  padding: 16px 20px;
  background: #fff;
  border-radius: 12px;
  border: 1px solid #e6e8eb;
}

.toolbar-left {
  display: flex;
  gap: 12px;
}

.hotspot-table-card {
  border-radius: 12px;
  border: 1px solid #e6e8eb;
}

.no-music-selected {
  padding: 40px;
  text-align: center;
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

.video-id-link {
  font-family: 'Consolas', 'Monaco', monospace;
  font-weight: 600;
  color: var(--el-color-primary);
  text-decoration: none;
  transition: all 0.2s ease;
}

.video-title .title-text {
  display: -webkit-box;
  -webkit-box-orient: vertical;
  -webkit-line-clamp: 2;
  overflow: hidden;
  text-overflow: ellipsis;
  line-height: 1.4;
  color: #374151;
  font-size: 12px;
  cursor: pointer;
  word-break: break-word;
}

.na-text {
  color: #9ca3af;
  font-style: italic;
}

.author-nickname {
  font-weight: 600;
  color: #374151;
  font-size: 12px;
}

.music-info {
  display: flex;
  flex-direction: column;
  gap: 2px;
}

.music-title {
  font-weight: 600;
  color: #374151;
  font-size: 12px;
  line-height: 1.3;
  display: -webkit-box;
  -webkit-box-orient: vertical;
  -webkit-line-clamp: 1;
  overflow: hidden;
  text-overflow: ellipsis;
}

.music-author {
  color: #6b7280;
  font-size: 11px;
  line-height: 1.3;
  display: -webkit-box;
  -webkit-box-orient: vertical;
  -webkit-line-clamp: 1;
  overflow: hidden;
  text-overflow: ellipsis;
}

.alert-level-tag, .time-window-tag, .trigger-metric-tag {
  border: none !important;
}

.growth-rate .growth-high {
  color: #ef4444;
  font-weight: 600;
}

.growth-rate .growth-medium {
  color: #f59e0b;
  font-weight: 600;
}

.growth-rate .growth-low {
  color: #10b981;
  font-weight: 600;
}

.current-stats {
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
  color: #ef4444;
}

.detection-time {
  font-size: 12px;
  color: #374151;
  line-height: 1.4;
}

.table-actions {
  display: flex;
  gap: 6px;
  align-items: center;
}


.alert-detail {
  max-height: 60vh;
  overflow-y: auto;
}

.detail-section {
  margin-bottom: 24px;
}

.detail-section h4 {
  margin: 0 0 12px 0;
  font-size: 16px;
  font-weight: 600;
  color: #1f2937;
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

:deep(.el-tag) {
  border: none !important;
}


/* 提醒统计样式 */
.alert-stats {
  display: flex;
  flex-direction: column;
  gap: 4px;
  align-items: center;
}

.total-alerts {
  font-weight: 600;
  color: #374151;
  font-size: 13px;
}

.level-stats {
  display: flex;
  gap: 4px;
  flex-wrap: wrap;
  justify-content: center;
}

.level-stats .el-tag {
  margin: 0 !important;
  font-size: 11px !important;
  padding: 2px 6px !important;
}

/* 展开行内容样式 */
.expand-content {
  padding: 20px 24px;
  background: linear-gradient(135deg, #f8fafc 0%, #f1f5f9 100%);
  border-left: 4px solid #3b82f6;
  margin: 0;
  position: relative;
}

.expand-content::before {
  content: '';
  position: absolute;
  top: 0;
  left: 0;
  right: 0;
  height: 1px;
  background: linear-gradient(90deg, transparent 0%, #e2e8f0 50%, transparent 100%);
}

.expand-table {
  border-radius: 8px;
  overflow: hidden;
  box-shadow: 0 1px 3px 0 rgba(0, 0, 0, 0.1), 0 1px 2px 0 rgba(0, 0, 0, 0.06);
  border: 1px solid #e2e8f0;
}

:deep(.expand-table .el-table__header) {
  background: linear-gradient(135deg, #ffffff 0%, #f8fafc 100%);
}

:deep(.expand-table .el-table th) {
  background: transparent;
  font-weight: 600;
  color: #475569;
  font-size: 13px;
  border-bottom: 2px solid #e2e8f0;
  padding: 12px;
  text-align: center;
}

:deep(.expand-table .el-table td) {
  padding: 12px;
  font-size: 12px;
  border-bottom: 1px solid #f1f5f9;
  text-align: center;
  background: #ffffff;
}

:deep(.expand-table .el-table__body tr:hover > td) {
  background-color: #f0f9ff !important;
  transform: translateY(-1px);
  transition: all 0.2s ease;
}

:deep(.expand-table .el-table__row:last-child td) {
  border-bottom: none;
}

:deep(.expand-table .el-table__stripe) {
  background-color: #fbfcfd !important;
}

:deep(.expand-table .el-table__stripe:hover) {
  background-color: #f0f9ff !important;
}

/* 优化展开表格中的标签样式 */
:deep(.expand-table .el-tag) {
  border-radius: 6px;
  font-weight: 500;
  border: 1px solid rgba(0, 0, 0, 0.06) !important;
}

/* 展开表格中的文本样式 */
.time-text {
  font-size: 12px;
  color: #64748b;
  font-weight: 500;
}

.growth-text {
  font-weight: 600;
  font-size: 13px;
}

.stat-number {
  font-size: 12px;
  color: #475569;
  font-weight: 500;
}

.expand-actions {
  display: flex;
  gap: 4px;
  justify-content: center;
  align-items: center;
}

/* 为主表格添加更好的间距 */
:deep(.el-table .el-table__expand-column .cell) {
  padding: 0;
  text-align: center;
}

:deep(.el-table__expand-icon) {
  color: #6b7280;
  transition: all 0.3s ease;
}

:deep(.el-table__expand-icon--expanded) {
  color: #3b82f6;
}
</style>