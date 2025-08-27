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
            <div class="page-title-section">
              <h2 class="page-title">
                {{ currentMusicInfo.title }}
                <span class="music-meta"> · {{ currentMusicInfo.author }}</span>
              </h2>
              <p class="page-meta">
                <span>专辑：{{ currentMusicInfo.album || '-' }}</span>
                <span v-if="currentMusicInfo.tagList && parseTags(currentMusicInfo.tagList).length"> · 标签：
                  <el-tag
                    v-for="tag in parseTags(currentMusicInfo.tagList)"
                    :key="tag"
                    size="small"
                    class="music-tag"
                  >
                    {{ tag }}
                  </el-tag>
                </span>
              </p>
            </div>
          </template>
          <template v-else>
            <h2 class="page-title">监控管理</h2>
            <p class="page-desc">管理您的抖音视频监控任务，实时掌握数据变化</p>
          </template>
        </div>

        <!-- 统计卡片 -->
        <div v-if="currentMusicId" class="stats-row">
          <div 
            class="stat-card total"
            :class="{ 'is-active': currentFilter === 'all' && !showHotspotFilter }"
            @click="filterVideos('all')"
          >
            <div class="stat-icon">
              <el-icon size="20"><VideoCamera /></el-icon>
            </div>
            <div class="stat-info">
              <div class="stat-value">{{ statistics.totalCount }}</div>
              <div class="stat-label">当前监控视频</div>
            </div>
          </div>
          
          <div 
            class="stat-card hotspot"
            :class="{ 'is-active': showHotspotFilter }"
            @click="toggleHotspotFilter"
          >
            <div class="stat-icon">
              <el-icon size="20"><TrendCharts /></el-icon>
            </div>
            <div class="stat-info">
              <div class="stat-value">{{ statistics.hotspotAlertCount || 0 }}</div>
              <div class="stat-label">72H热度异动</div>
            </div>
          </div>
          
          <div 
            class="stat-card auto"
            :class="{ 'is-active': currentFilter === 'auto' && !showHotspotFilter }"
            @click="filterVideos('auto')"
          >
            <div class="stat-icon">
              <el-icon size="20" color="#10b981"><Star /></el-icon>
            </div>
            <div class="stat-info">
              <div class="stat-value">{{ statistics.autoCount }}</div>
              <div class="stat-label">自选视频</div>
            </div>
          </div>
          
          <div 
            class="stat-card manual"
            :class="{ 'is-active': currentFilter === 'manual' && !showHotspotFilter }"
            @click="filterVideos('manual')"
          >
            <div class="stat-icon">
              <el-icon size="20"><CircleCheck /></el-icon>
            </div>
            <div class="stat-info">
              <div class="stat-value">{{ statistics.manualCount }}</div>
              <div class="stat-label">手动添加</div>
            </div>
          </div>
          
          <div 
            class="stat-card error"
            :class="{ 'is-active': currentFilter === 'error' && !showHotspotFilter }"
            @click="filterVideos('error')"
          >
            <div class="stat-icon">
              <el-icon size="20"><Warning /></el-icon>
            </div>
            <div class="stat-info">
              <div class="stat-value">{{ statistics.abnormalCount }}</div>
              <div class="stat-label">异常监控</div>
            </div>
          </div>
        </div>

        <!-- 操作栏（已与统计卡片交换位置） -->
        <div v-if="currentMusicId" class="section-divider"></div>
        <div v-if="currentMusicId" class="toolbar">
          <div class="toolbar-left">
            <el-button v-if="currentMusicId" @click="goBackFromMusic" :icon="ArrowLeft">
              {{ route.query.from === 'hotspot' ? '返回热度提醒' : '返回音乐管理' }}
            </el-button>
            <el-button type="primary" @click="showAddDialog = true" :icon="Plus">
              添加监控
            </el-button>
            <el-button @click="() => loadMonitorVideos()" :loading="loading" :icon="Refresh">
              刷新
            </el-button>
          </div>
          <div class="toolbar-right">
            <!-- 热度异动模式的搜索控件 -->
            <div v-if="showHotspotFilter" class="hotspot-search-controls">
              <el-select
                v-model="sortField"
                placeholder="排序方式"
                style="width: 120px;"
                @change="handleSortChange"
              >
                <el-option label="按点赞数" value="diggCount" />
                <el-option label="按发布时间" value="publishTime" />
                <el-option label="按创建时间" value="createTime" />
              </el-select>
              <el-select
                v-model="sortOrder"
                placeholder="排序顺序"
                style="width: 90px;"
                @change="handleSortChange"
              >
                <el-option label="降序" value="desc" />
                <el-option label="升序" value="asc" />
              </el-select>
              
              <div class="time-range-controls">
                <el-date-picker
                  v-model="startTime"
                  type="datetime"
                  placeholder="开始时间"
                  style="width: 160px;"
                  format="YYYY-MM-DD HH:mm:ss"
                  value-format="YYYY-MM-DD HH:mm:ss"
                  @change="handleTimeChange"
                />
                <span class="time-separator">至</span>
                <el-date-picker
                  v-model="endTime"
                  type="datetime"
                  placeholder="结束时间"
                  style="width: 160px;"
                  format="YYYY-MM-DD HH:mm:ss"
                  value-format="YYYY-MM-DD HH:mm:ss"
                  @change="handleTimeChange"
                />
              </div>
              
              <el-input
                v-model="searchKeyword"
                placeholder="搜索视频ID、链接或播主名称"
                :prefix-icon="Search"
                style="width: 250px;"
                clearable
                @keyup.enter="handleSearch"
                @clear="handleSearch"
              />
              <el-button @click="handleSearch" :icon="Search" type="primary">搜索</el-button>
            </div>
            
            <!-- 普通模式的搜索控件 -->
            <div v-else class="normal-search-controls">
              <el-select
                v-model="sortField"
                placeholder="排序方式"
                style="width: 140px; margin-right: 12px;"
                @change="handleSortChange"
              >
                <el-option label="按点赞数" value="diggCount" />
                <el-option label="按发布时间" value="publishTime" />
                <el-option label="按创建时间" value="createTime" />
              </el-select>
              <el-select
                v-model="sortOrder"
                placeholder="排序顺序"
                style="width: 100px; margin-right: 12px;"
                @change="handleSortChange"
              >
                <el-option label="降序" value="desc" />
                <el-option label="升序" value="asc" />
              </el-select>
              <el-input
                v-model="searchKeyword"
                placeholder="搜索视频ID、链接或播主名称"
                :prefix-icon="Search"
                style="width: 300px;"
                clearable
                @keyup.enter="handleSearch"
                @clear="handleSearch"
              />
              <el-button @click="handleSearch" :icon="Search" style="margin-left: 8px;">搜索</el-button>
            </div>
          </div>
        </div>

        <!-- 标签筛选区域 -->
        <div v-if="allSearchTags.length > 0 || allSearchChannels.length > 0" class="tag-filter-section">
          <div class="tag-filter-row">
            <div class="tag-filter-content">
              <!-- 搜索标签 -->
              <div v-if="allSearchTags.length > 0" class="filter-group">
                <span class="filter-group-title">搜索标签：</span>
                <el-tag
                  v-for="tag in allSearchTags"
                  :key="`tag-${tag.tagName}`"
                  size="large"
                  :type="selectedSearchTags.includes(tag.tagName) ? 'primary' : 'info'"
                  :effect="selectedSearchTags.includes(tag.tagName) ? 'dark' : 'light'"
                  class="filter-tag"
                  @click="toggleSearchTag(tag.tagName)"
                >
                  {{ tag.tagName }}
                  <span class="tag-count">
                    ({{ tag.videoCount }})
                  </span>
                </el-tag>
              </div>
              
              <!-- 搜索类型 -->
              <div v-if="allSearchChannels.length > 0" class="filter-group">
                <span class="filter-group-title">搜索类型：</span>
                <el-tag
                  v-for="channel in allSearchChannels"
                  :key="`channel-${channel.channelName}`"
                  size="large"
                  :type="selectedSearchChannels.includes(channel.channelName) ? 'warning' : 'info'"
                  :effect="selectedSearchChannels.includes(channel.channelName) ? 'dark' : 'light'"
                  class="filter-tag"
                  @click="toggleSearchChannel(channel.channelName)"
                >
                  {{ channel.channelName }}
                  <span class="tag-count">
                    ({{ channel.videoCount }})
                  </span>
                </el-tag>
              </div>
            </div>
            <el-button 
              v-if="selectedSearchTags.length > 0 || selectedSearchChannels.length > 0"
              type="text" 
              size="small" 
              @click="clearSelectedTags"
              class="clear-tags-btn"
            >
              清除所有 ({{ selectedSearchTags.length + selectedSearchChannels.length }})
            </el-button>
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
          
          <!-- 无音乐选择时的提示 -->
          <div v-if="!currentMusicId" class="no-music-selected">
            <el-empty 
              description="请先选择要查看监控的音乐"
              :image-size="120"
            >
              <el-button type="primary" @click="router.push('/music')">
                选择音乐
              </el-button>
            </el-empty>
          </div>
          
          <div v-else v-loading="loading">
            <el-table 
              :data="monitorList" 
              style="width: 100%"
              @selection-change="handleSelectionChange"
              :empty-text="monitorList.length === 0 ? '暂无监控数据' : ''"
              size="default"
              :cell-style="{ padding: '6px 6px' }"
              :header-cell-style="{ padding: '8px 6px', background: '#fafafa' }"
            >
              <el-table-column type="selection" width="50" />
              
              <el-table-column label="视频ID" width="140">
                <template #default="{ row }">
                  <div class="video-id">
                    <div 
                      v-if="isRecentHotspotAlert(row)"
                      class="hotspot-video-container"
                    >
                      <el-icon class="hotspot-video-icon" size="12"><TrendCharts /></el-icon>
                      <el-link 
                        v-if="row.monitorVideo?.awemeId || row.monitorVideo?.id || row.awemeId"
                        :href="`https://www.douyin.com/video/${row.monitorVideo?.awemeId || row.monitorVideo?.id || row.awemeId}`" 
                        target="_blank"
                        type="primary"
                        class="video-id-link hotspot-video-id"
                      >
                        {{ getTruncatedVideoId(row.monitorVideo?.awemeId || row.monitorVideo?.id || row.awemeId) }}
                      </el-link>
                      <span v-else class="video-id-text hotspot-video-id">
                        {{ getTruncatedVideoId(row.monitorVideo?.awemeId || row.monitorVideo?.id || row.awemeId) }}
                      </span>
                    </div>
                    <div 
                      v-else-if="row.monitorVideo?.joinCustomType === 1"
                      class="custom-video-container"
                    >
                      <el-icon class="custom-video-icon" size="12"><Star /></el-icon>
                      <el-link 
                        v-if="row.monitorVideo?.awemeId || row.monitorVideo?.id || row.awemeId"
                        :href="`https://www.douyin.com/video/${row.monitorVideo?.awemeId || row.monitorVideo?.id || row.awemeId}`" 
                        target="_blank"
                        type="primary"
                        class="video-id-link custom-video-id"
                      >
                        {{ getTruncatedVideoId(row.monitorVideo?.awemeId || row.monitorVideo?.id || row.awemeId) }}
                      </el-link>
                      <span v-else class="video-id-text custom-video-id">
                        {{ getTruncatedVideoId(row.monitorVideo?.awemeId || row.monitorVideo?.id || row.awemeId) }}
                      </span>
                    </div>
                    <template v-else>
                      <el-link 
                        v-if="row.monitorVideo?.awemeId || row.monitorVideo?.id || row.awemeId"
                        :href="`https://www.douyin.com/video/${row.monitorVideo?.awemeId || row.monitorVideo?.id || row.awemeId}`" 
                        target="_blank"
                        type="primary"
                        class="video-id-link"
                      >
                        {{ getTruncatedVideoId(row.monitorVideo?.awemeId || row.monitorVideo?.id || row.awemeId) }}
                      </el-link>
                      <span v-else class="video-id-text">
                        {{ getTruncatedVideoId(row.monitorVideo?.awemeId || row.monitorVideo?.id || row.awemeId) }}
                      </span>
                    </template>
                  </div>
                  <!-- 调试信息 -->
                  <div v-if="false" style="font-size: 10px; color: #999;">
                    Debug: {{ JSON.stringify({
                      awemeId: row.monitorVideo?.awemeId,
                      id: row.monitorVideo?.id,
                      rowAwemeId: row.awemeId,
                      workUrl: row.monitorVideo?.workUrl,
                      joinCustomType: row.monitorVideo?.joinCustomType
                    }) }}
                  </div>
                </template>
              </el-table-column>
              
              <el-table-column label="视频描述" width="200">
                <template #default="{ row }">
                  <div class="video-desc">
                    <el-tooltip 
                      v-if="getCleanDescription(row)"
                      :content="getCleanDescription(row)"
                      placement="top"
                      :show-after="500"
                    >
                      <span class="desc-text">{{ getCleanDescription(row) }}</span>
                    </el-tooltip>
                    <span v-else class="na-text">无描述</span>
                  </div>
                </template>
              </el-table-column>
              
              <el-table-column label="播主名称" width="115">
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
              
              <el-table-column label="话题标签" width="200">
                <template #default="{ row }">
                  <div v-if="getTopicsArray(row).length > 0" class="hashtag-list">
                    <el-tag
                      v-for="tag in getTopicsArray(row).slice(0, 5)"
                      :key="tag"
                      size="small"
                      type="info"
                      class="hashtag-tag"
                    >
                      {{ tag }}
                    </el-tag>
                    <el-tooltip 
                      v-if="getTopicsArray(row).length > 5"
                      :content="getTopicsArray(row).slice(5).join('、')"
                      placement="top"
                    >
                      <el-tag size="small" type="info" class="hashtag-more">
                        +{{ getTopicsArray(row).length - 5 }}
                      </el-tag>
                    </el-tooltip>
                  </div>
                  <span v-else class="na-text">无话题标签</span>
                </template>
              </el-table-column>
              
              <!-- 当开启72H热度异动筛选时显示最后提醒时间 -->
              <template v-if="showHotspotFilter">
                <el-table-column 
                  label="最后提醒时间" 
                  width="160"
                  align="center"
                >
                  <template #default="{ row }">
                    <div class="latest-alert-time">
                      <span v-if="row.monitorVideo?.latestHotspotAlertTime" class="alert-time">
                        {{ formatPublishTime(row.monitorVideo.latestHotspotAlertTime) }}
                      </span>
                      <span v-else class="na-text">无提醒记录</span>
                    </div>
                  </template>
                </el-table-column>
              </template>
              
              <!-- 当筛选自选视频时显示视频备注和投资总金额 -->
              <template v-else-if="currentFilter === 'auto'">
                <el-table-column 
                  label="视频备注" 
                  width="150"
                >
                  <template #default="{ row }">
                    <div class="video-remark">
                      <el-tooltip 
                        v-if="row.monitorVideo?.remark"
                        :content="row.monitorVideo.remark"
                        placement="top"
                        :show-after="500"
                      >
                        <span class="remark-text">{{ row.monitorVideo.remark }}</span>
                      </el-tooltip>
                      <span v-else class="na-text">无备注</span>
                    </div>
                  </template>
                </el-table-column>
                
                <el-table-column 
                  label="投资总金额" 
                  width="120"
                  align="right"
                >
                  <template #default="{ row }">
                    <div class="total-investment">
                      <span v-if="row.monitorVideo?.totalInvestmentAmount && row.monitorVideo.totalInvestmentAmount > 0" 
                            class="investment-amount">
                        ¥{{ formatInvestmentAmount(row.monitorVideo.totalInvestmentAmount) }}
                      </span>
                      <span v-else class="na-text">-</span>
                    </div>
                  </template>
                </el-table-column>
              </template>
              
              <!-- 当筛选其他类型时显示搜索标签和搜索类型 -->
              <template v-else>
                <el-table-column 
                  label="搜索标签" 
                  width="120"
                >
                  <template #default="{ row }">
                    <div v-if="getSearchTags(row).length > 0" class="search-tag-list">
                      <el-tag
                        v-for="tag in getSearchTags(row).slice(0, 3)"
                        :key="tag"
                        size="small"
                        type="success"
                        class="search-tag"
                        @click="selectSearchTag(tag)"
                      >
                        {{ tag }}
                      </el-tag>
                      <el-tooltip 
                        v-if="getSearchTags(row).length > 3"
                        :content="getSearchTags(row).slice(3).join('、')"
                        placement="top"
                      >
                        <el-tag size="small" type="success" class="search-tag-more">
                          +{{ getSearchTags(row).length - 3 }}
                        </el-tag>
                      </el-tooltip>
                    </div>
                    <span v-else class="na-text">无搜索标签</span>
                  </template>
                </el-table-column>
                
                <el-table-column 
                  label="搜索类型" 
                  width="100"
                >
                  <template #default="{ row }">
                    <div v-if="getSearchChannels(row).length > 0" class="search-channel-list">
                      <el-tag
                        v-for="channel in getSearchChannels(row).slice(0, 3)"
                        :key="channel"
                        size="small"
                        type="warning"
                        class="search-channel"
                        @click="selectSearchChannel(channel)"
                      >
                        {{ channel }}
                      </el-tag>
                      <el-tooltip 
                        v-if="getSearchChannels(row).length > 3"
                        :content="getSearchChannels(row).slice(3).join('、')"
                        placement="top"
                      >
                        <el-tag size="small" type="warning" class="search-channel-more">
                          +{{ getSearchChannels(row).length - 3 }}
                        </el-tag>
                      </el-tooltip>
                    </div>
                    <span v-else class="na-text">无搜索类型</span>
                  </template>
                </el-table-column>
              </template>
              
              <el-table-column label="最新数据" width="130">
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
              
              <el-table-column label="发布时间" width="150" align="center">
                <template #default="{ row }">
                  <div class="publish-time">
                    {{ formatPublishTime(row.monitorVideo?.videoPublishTime) }}
                  </div>
                </template>
              </el-table-column>
              
              <el-table-column label="创建时间" width="150" align="center">
                <template #default="{ row }">
                  <div class="create-time">
                    {{ formatPublishTime(row.monitorVideo?.createTime) }}
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
                      >
                        {{ row.monitorVideo?.status === 1 ? '停用' : '启用' }}
                      </el-button>
                    </el-tooltip>
                    
                    <el-tooltip :content="row.monitorVideo?.joinCustomType === 1 ? '更新自选' : '加入自选'" placement="top">
                      <el-button 
                        type="success" 
                        size="small" 
                        :icon="Collection"
                        @click="openCustomSelectionDialog(row)"
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
            
            <!-- 分页组件 -->
            <div class="pagination-container" v-if="total > 0">
              <el-pagination
                v-model:current-page="currentPage"
                v-model:page-size="pageSize"
                :page-sizes="[10, 20, 50, 100]"
                :total="total"
                layout="total, sizes, prev, pager, next, jumper"
                @size-change="handleSizeChange"
                @current-change="handleCurrentChange"
                class="pagination"
              />
            </div>
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
        
        <el-form-item label="音乐信息" v-if="currentMusicId && currentMusicInfo">
          <div class="music-info-display">
            <div class="music-title">{{ currentMusicInfo.title }} - {{ currentMusicInfo.author }}</div>
            <div class="music-album" v-if="currentMusicInfo.album">专辑：{{ currentMusicInfo.album }}</div>
            <div class="music-tags" v-if="currentMusicInfo.tagList && parseTags(currentMusicInfo.tagList).length">
              标签：
              <el-tag
                v-for="tag in parseTags(currentMusicInfo.tagList)"
                :key="tag"
                size="small"
                class="music-tag"
              >
                {{ tag }}
              </el-tag>
            </div>
          </div>
        </el-form-item>
        <el-form-item label="音乐信息" v-else>
          <div class="music-info-display">
            <el-alert
              title="请先选择音乐"
              type="warning"
              :closable="false"
              show-icon
            >
              <template #default>
                <p>添加监控视频前，请先在音乐管理页面选择要监控的音乐</p>
              </template>
            </el-alert>
          </div>
        </el-form-item>
      </el-form>
      
      <template #footer>
        <el-button @click="showAddDialog = false">取消</el-button>
        <el-button 
          type="primary" 
          @click="addMode === 'single' ? handleAddMonitor() : handleExcelUpload()" 
          :loading="addMode === 'single' ? addLoading : excelUploading"
          :disabled="addMode === 'batch' && !addForm.file"
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

    <!-- 统计对话框 -->
    <el-dialog
      v-model="showStatsDialog"
      title="视频数据统计"
      width="90%"
      top="5vh"
      :close-on-click-modal="false"
    >
      <div class="stats-dialog-content">
        <div class="stats-header">
          <div class="video-info">
            <span class="video-id-label">视频ID:</span>
            <span class="video-id-value">{{ currentStatsAwemeId }}</span>
          </div>
          <div class="time-range-selector">
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

        <div v-loading="statsLoading" class="stats-content">
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
                <div class="stat-value">{{ formatStatsNumber(latestStats.diggCount) }}</div>
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
                <div class="stat-value">{{ formatStatsNumber(latestStats.commentCount) }}</div>
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
                <div class="stat-value">{{ formatStatsNumber(latestStats.collectCount) }}</div>
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
                <div class="stat-value">{{ formatStatsNumber(latestStats.shareCount) }}</div>
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
                style="height: 400px;"
                autoresize
              />
              <div v-else-if="!statsLoading" class="empty-chart">
                <el-empty description="暂无图表数据" />
              </div>
            </div>
          </el-card>
        </div>
      </div>
      
      <template #footer>
        <el-button @click="closeStatsDialog">关闭</el-button>
      </template>
    </el-dialog>

    <!-- 播主信息对话框 -->
    <el-dialog
      v-model="showAuthorDialog"
      title="播主信息"
      width="600px"
      :close-on-click-modal="false"
    >
      <div v-loading="authorLoading">
        <div v-if="currentAuthor" class="author-info-dialog">
          <el-descriptions :column="2" border>
            <el-descriptions-item label="用户ID">{{ currentAuthor.userId }}</el-descriptions-item>
            <el-descriptions-item label="昵称">{{ currentAuthor.nickname }}</el-descriptions-item>
            <el-descriptions-item label="粉丝">{{ formatAuthorNumber(currentAuthor.followerCount) }}</el-descriptions-item>
            <el-descriptions-item label="获赞">{{ formatAuthorNumber(currentAuthor.totalFavorited) }}</el-descriptions-item>
            <el-descriptions-item label="性别">{{ currentAuthor.gender || '-' }}</el-descriptions-item>
            <el-descriptions-item label="地区">{{ currentAuthor.ipLocation || '-' }}</el-descriptions-item>
            <el-descriptions-item v-if="currentAuthor.userUrl" label="播主地址" :span="2">
              <el-link 
                type="primary" 
                :href="currentAuthor.userUrl" 
                target="_blank"
                class="author-link"
              >
                {{ currentAuthor.userUrl }}
              </el-link>
            </el-descriptions-item>
          </el-descriptions>
        </div>
        <el-empty v-else-if="!authorLoading" description="暂无播主信息" />
      </div>
      
      <template #footer>
        <el-button @click="closeAuthorDialog">关闭</el-button>
      </template>
    </el-dialog>

    <!-- 加入自选对话框 -->
    <el-dialog
      v-model="showCustomDialog"
      :title="currentMonitorVideo?.monitorVideo?.joinCustomType === 1 ? '更新自选' : '加入自选'"
      width="700px"
      :close-on-click-modal="false"
    >
      <div class="custom-selection-content">
        <div class="video-info-section" v-if="currentMonitorVideo">
          <h4>视频信息</h4>
          <el-descriptions :column="2" border size="small">
            <el-descriptions-item label="视频ID">{{ currentMonitorVideo.monitorVideo?.awemeId }}</el-descriptions-item>
            <el-descriptions-item label="播主">{{ currentMonitorVideo.authorInfo?.nickname || currentMonitorVideo.videoInfo?.authorId }}</el-descriptions-item>
            <el-descriptions-item label="视频标题" :span="2">
              <div class="video-title">
                {{ getCleanDescription(currentMonitorVideo) || '暂无标题' }}
              </div>
            </el-descriptions-item>
          </el-descriptions>
        </div>

        <div class="description-section">
          <h4>视频备注</h4>
          <el-form-item>
            <el-input
              v-model="investmentForm.description"
              type="textarea"
              :rows="3"
              placeholder="请输入视频备注（可选）"
              maxlength="200"
              show-word-limit
            />
          </el-form-item>
        </div>

        <div class="investment-section">
          <h4>投资记录</h4>
          <div v-if="investmentRecordsLoading" class="loading-tip">
            <el-icon class="rotating"><Loading /></el-icon>
            <span>正在加载投资记录...</span>
          </div>
          <template v-else>
            <!-- 如果有投资记录，显示投资记录列表 -->
            <div v-if="investmentForm.amounts.length > 0">
              <div v-for="(item, index) in investmentForm.amounts" :key="index" class="investment-item">
            <div class="investment-row">
              <el-form-item label="投资金额" class="amount-input">
                <el-input-number
                  v-model="item.amount"
                  :min="0"
                  :step="100"
                  :precision="2"
                  placeholder="请输入投资金额"
                  style="width: 100%"
                />
              </el-form-item>
              
              <el-form-item label="投资时间" class="time-input">
                <el-date-picker
                  v-model="item.investmentTime"
                  type="datetime"
                  placeholder="选择投资时间"
                  format="YYYY-MM-DD HH:mm"
                  value-format="YYYY-MM-DDTHH:mm"
                  style="width: 100%"
                />
              </el-form-item>
              
              <div class="action-buttons">
                <el-button
                  v-if="index === investmentForm.amounts.length - 1"
                  type="primary"
                  size="small"
                  :icon="Plus"
                  @click="addInvestmentAmount"
                  circle
                />
                <el-button
                  type="danger"
                  size="small"
                  :icon="Delete"
                  @click="removeInvestmentAmount(index)"
                  circle
                />
              </div>
              </div>
              </div>
            </div>
            
            <!-- 如果没有投资记录，显示添加按钮 -->
            <div v-else class="no-investment-records">
              <el-button 
                type="primary" 
                :icon="Plus" 
                @click="addFirstInvestmentAmount"
                class="add-investment-btn"
              >
                添加投资记录
              </el-button>
            </div>
          </template>
        </div>
      </div>
      
      <template #footer>
        <el-button @click="closeCustomDialog">取消</el-button>
        <el-button 
          v-if="currentMonitorVideo?.monitorVideo?.joinCustomType === 1"
          type="danger" 
          @click="cancelCustomSelection" 
          :loading="customSelectionLoading"
        >
          取消自选
        </el-button>
        <el-button 
          type="primary" 
          @click="submitCustomSelection" 
          :loading="customSelectionLoading"
        >
          {{ currentMonitorVideo?.monitorVideo?.joinCustomType === 1 ? '确认更新' : '确认加入' }}
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
import { parseTags } from '@/utils/tagUtils'
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
  ArrowUp,
  Upload,
  Collection,
  Close,
  Warning,
  MagicStick,
  Cpu,
  TrendCharts,
  Share,
  Star
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
const addLoading = ref(false)
const monitorList = ref([])
const searchKeyword = ref('')
const selectedRows = ref([])
const currentMusicId = ref(null) // 当前过滤的音乐ID
const currentMusicInfo = ref(null)
const selectedSearchTags = ref([])
const allSearchTags = ref([]) // 格式：[{tagName: 'xxx', videoCount: 10}]
const selectedSearchChannels = ref([])
const allSearchChannels = ref([]) // 格式：[{channelName: 'xxx', videoCount: 5}]
const sortField = ref('diggCount') // 排序字段：diggCount(点赞数), publishTime(发布时间), createTime(创建时间)
const sortOrder = ref('desc') // 排序顺序：desc(降序), asc(升序)

// 热度异动筛选相关
const showHotspotFilter = ref(false)
const startTime = ref('')
const endTime = ref('')

// 分页相关
const currentPage = ref(1)
const pageSize = ref(10)
const total = ref(0)

// 统计数据
const statistics = ref({
  totalCount: 0,
  manualCount: 0,
  autoCount: 0,
  abnormalCount: 0,
  hotspotAlertCount: 0
})


const showAddDialog = ref(false)
const showBatchDialog = ref(false)
const showTaskProgressDialog = ref(false)
const excelUploading = ref(false)
const addMode = ref('single') // 'single' 或 'batch'
const addForm = ref({
  videoUrl: '',
  file: null
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

// 统计对话框相关数据
const showStatsDialog = ref(false)
const statsLoading = ref(false)
const currentStatsAwemeId = ref(null)
const latestStats = ref(null)
const statsDays = ref('7')
const chartOption = ref(null)
const chartData = ref(null)
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

// 播主信息对话框相关数据
const showAuthorDialog = ref(false)
const authorLoading = ref(false)
const currentAuthor = ref(null)

// 加入自选对话框相关数据
const showCustomDialog = ref(false)
const customSelectionLoading = ref(false)
const investmentRecordsLoading = ref(false)
const currentMonitorVideo = ref(null)
const investmentForm = ref({
  description: '', // 视频描述
  amounts: [
    {
      id: null,
      amount: null,
      investmentTime: '' // 初始化时先设为空，在实际使用时再设置北京时间
    }
  ]
})



// 分页处理函数
const handleSizeChange = (newSize) => {
  pageSize.value = newSize
  currentPage.value = 1
  loadMonitorVideos(1)
}

const handleCurrentChange = (newPage) => {
  currentPage.value = newPage
  loadMonitorVideos(newPage)
}

// 搜索处理函数
const handleSearch = () => {
  currentPage.value = 1
  loadMonitorVideos(1)
}

// 热度异动切换
const toggleHotspotFilter = () => {
  showHotspotFilter.value = !showHotspotFilter.value
  
  if (!showHotspotFilter.value) {
    // 关闭时清空时间筛选
    startTime.value = ''
    endTime.value = ''
  } else {
    // 开启时设置72小时前到现在的时间（与API参数保持一致）
    const seventyTwoHoursAgo = new Date()
    seventyTwoHoursAgo.setTime(seventyTwoHoursAgo.getTime() - 72 * 60 * 60 * 1000)
    startTime.value = formatToUTC8TimeString(seventyTwoHoursAgo)
    
    const now = new Date()
    endTime.value = formatToUTC8TimeString(now)
  }
  // 重置到第一页并重新加载数据
  currentPage.value = 1
  loadMonitorVideos(1)
  ElMessage.success(showHotspotFilter.value ? '已开启72H热度异动筛选' : '已关闭72H热度异动筛选')
}

// 时间变化处理
const handleTimeChange = () => {
  if (showHotspotFilter.value && startTime.value && endTime.value) {
    currentPage.value = 1
    loadMonitorVideos(1)
  }
}

// 加载统计数据
const loadStatistics = async () => {
  if (!currentMusicId.value) {
    return
  }
  
  try {
    // 构建统计参数，与列表查询保持一致
    const params = {
      musicId: currentMusicId.value
    }
    
    // 默认添加时间范围参数：统一使用72小时前到现在（UTC+8）
    const seventyTwoHoursAgo = new Date()
    seventyTwoHoursAgo.setTime(seventyTwoHoursAgo.getTime() - 72 * 60 * 60 * 1000)
    params.startTime = formatToUTC8TimeString(seventyTwoHoursAgo)
    
    // 设置当前时间为结束时间（UTC+8）
    const now = new Date()
    params.endTime = formatToUTC8TimeString(now)
    
    const response = await monitorApi.getMonitorStatistics(params)
    console.log('Monitor页面: 统计数据API响应:', response)
    console.log('Monitor页面: 统计数据请求参数:', params)
    
    if (response.code === 200) {
      statistics.value = response.data
      console.log('Monitor页面: 统计数据:', statistics.value)
    } else {
      console.warn('获取统计数据失败:', response.message)
      // 失败时重置为0
      statistics.value = {
        totalCount: 0,
        manualCount: 0,
        autoCount: 0,
        abnormalCount: 0,
        hotspotAlertCount: 0
      }
    }
  } catch (error) {
    console.error('Monitor页面: 加载统计数据失败:', error)
    // 异常时重置为0
    statistics.value = {
      totalCount: 0,
      manualCount: 0,
      autoCount: 0,
      abnormalCount: 0,
      hotspotAlertCount: 0
    }
  }
}

// 加载搜索标签和频道数据
const loadTagsAndChannels = async () => {
  if (!currentMusicId.value) {
    return
  }
  
  try {
    const [tagsResponse, channelsResponse] = await Promise.all([
      monitorApi.getMonitorTags(currentMusicId.value),
      monitorApi.getMonitorChannels(currentMusicId.value)
    ])
    
    console.log('Monitor页面: 标签统计API响应:', tagsResponse)
    console.log('Monitor页面: 频道统计API响应:', channelsResponse)
    
    // 处理标签数据
    if (tagsResponse.code === 200) {
      allSearchTags.value = tagsResponse.data || []
    } else {
      console.warn('获取标签数据失败:', tagsResponse.message)
      allSearchTags.value = []
    }
    
    // 处理频道数据
    if (channelsResponse.code === 200) {
      allSearchChannels.value = channelsResponse.data || []
    } else {
      console.warn('获取频道数据失败:', channelsResponse.message)
      allSearchChannels.value = []
    }
    
    console.log('Monitor页面: 标签数据:', allSearchTags.value)
    console.log('Monitor页面: 频道数据:', allSearchChannels.value)
    
  } catch (error) {
    console.error('Monitor页面: 加载标签和频道数据失败:', error)
    allSearchTags.value = []
    allSearchChannels.value = []
  }
}


const currentFilter = ref('all')

// 处理排序变化
const handleSortChange = () => {
  currentPage.value = 1
  loadMonitorVideos(1)
}

// 排序函数
const sortMonitors = (monitors) => {
  return monitors.slice().sort((a, b) => {
    let valueA, valueB
    
    switch (sortField.value) {
      case 'diggCount':
        valueA = a?.latestStats?.diggCount || 0
        valueB = b?.latestStats?.diggCount || 0
        break
      case 'publishTime':
        valueA = a?.monitorVideo?.videoPublishTime || 0
        valueB = b?.monitorVideo?.videoPublishTime || 0
        break
      case 'createTime':
        valueA = new Date(a?.monitorVideo?.createTime || 0).getTime()
        valueB = new Date(b?.monitorVideo?.createTime || 0).getTime()
        break
      default:
        valueA = a?.latestStats?.diggCount || 0
        valueB = b?.latestStats?.diggCount || 0
    }
    
    if (sortOrder.value === 'asc') {
      return valueA - valueB
    } else {
      return valueB - valueA
    }
  })
}

// 获取搜索标签数组
const getSearchTags = (row) => {
  // 从 MonitorVideo 的 tag 字段获取标签
  const tag = row.monitorVideo?.tag
  if (!tag) return []
  
  if (Array.isArray(tag)) {
    return tag
  }
  
  // 如果是字符串，尝试解析JSON或按逗号分割
  if (typeof tag === 'string') {
    try {
      const parsed = JSON.parse(tag)
      if (Array.isArray(parsed)) {
        return parsed
      }
    } catch (e) {
      // 如果不是JSON，尝试按逗号分割
      return tag.split(',').map(t => t.trim()).filter(t => t)
    }
  }
  
  return []
}

// 获取搜索类型数组
const getSearchChannels = (row) => {
  // 从 MonitorVideo 的 channel 字段获取搜索类型
  const channel = row.monitorVideo?.channel
  if (!channel) return []
  
  if (Array.isArray(channel)) {
    return channel
  }
  
  // 如果是字符串，尝试解析JSON或按逗号分割
  if (typeof channel === 'string') {
    try {
      const parsed = JSON.parse(channel)
      if (Array.isArray(parsed)) {
        return parsed
      }
    } catch (e) {
      // 如果不是JSON，尝试按逗号分割
      return channel.split(',').map(c => c.trim()).filter(c => c)
    }
  }
  
  return []
}

// 切换搜索标签选择
const toggleSearchTag = (tag) => {
  const index = selectedSearchTags.value.indexOf(tag)
  if (index > -1) {
    selectedSearchTags.value.splice(index, 1)
  } else {
    selectedSearchTags.value.push(tag)
  }
  
  // 重新加载数据
  currentPage.value = 1
  loadMonitorVideos(1)
  
  const totalSelected = selectedSearchTags.value.length + selectedSearchChannels.value.length
  if (totalSelected > 0) {
    ElMessage.success(`已选择 ${totalSelected} 个筛选条件`)
  } else {
    ElMessage.success(`已清除所有筛选条件`)
  }
}

// 切换搜索类型选择
const toggleSearchChannel = (channel) => {
  const index = selectedSearchChannels.value.indexOf(channel)
  if (index > -1) {
    selectedSearchChannels.value.splice(index, 1)
  } else {
    selectedSearchChannels.value.push(channel)
  }
  
  // 重新加载数据
  currentPage.value = 1
  loadMonitorVideos(1)
  
  const totalSelected = selectedSearchTags.value.length + selectedSearchChannels.value.length
  if (totalSelected > 0) {
    ElMessage.success(`已选择 ${totalSelected} 个筛选条件`)
  } else {
    ElMessage.success(`已清除所有筛选条件`)
  }
}

// 选择搜索标签（点击表格中的标签）
const selectSearchTag = (tag) => {
}

// 选择搜索类型（点击表格中的类型）
const selectSearchChannel = (channel) => {

}

// 清除所有选中的标签
const clearSelectedTags = () => {
  selectedSearchTags.value = []
  selectedSearchChannels.value = []
  // 重新加载数据
  currentPage.value = 1
  loadMonitorVideos(1)
  ElMessage.success('已清除所有筛选条件')
}


const filterVideos = (filterType) => {
  currentFilter.value = filterType
  
  // 清除热度异动筛选状态
  showHotspotFilter.value = false
  startTime.value = ''
  endTime.value = ''
  
  currentPage.value = 1 // 重置到第一页
  loadMonitorVideos(1) // 重新加载数据
  
  const filterMessages = {
    'all': '已显示当前监控视频',
    'manual': '已过滤显示手动添加的视频',
    'error': '已过滤显示异常监控的视频',
    'auto': '已过滤显示自选视频'
  }
  
  ElMessage.success(filterMessages[filterType] || '过滤完成')
}

// 安全获取话题标签数组
const getTopicsArray = (row) => {
  // 尝试从多个可能的位置获取topics数据
  let topics = null
  
  // 首先尝试从videoInfo.topics获取
  if (row.videoInfo?.topics) {
    topics = row.videoInfo.topics
  }
  // 然后尝试从根级别的topics获取
  else if (row.topics) {
    topics = row.topics
  }
  
  // 确保topics是数组类型
  if (Array.isArray(topics)) {
    return topics
  }
  
  // 如果topics是字符串，尝试解析（可能是JSON字符串）
  if (typeof topics === 'string') {
    try {
      const parsed = JSON.parse(topics)
      if (Array.isArray(parsed)) {
        return parsed
      }
    } catch (e) {
      // 解析失败，返回空数组
    }
  }
  
  // 默认返回空数组
  return []
}

// 获取清理后的视频描述（去除#内容）
const getCleanDescription = (row) => {
  // 尝试从多个可能的位置获取desc数据
  let desc = null
  
  // 首先尝试从videoInfo.desc获取
  if (row.videoInfo?.desc) {
    desc = row.videoInfo.desc
  }
  // 然后尝试从根级别的desc获取
  else if (row.desc) {
    desc = row.desc
  }
  
  // 如果没有描述，返回空字符串
  if (!desc) {
    return ''
  }
  
  // 去除所有#开头的内容（包括#号本身）
  const cleanDesc = desc.replace(/#[^\s#]*/g, '').trim()
  
  // 如果清理后为空，返回原描述
  return cleanDesc || desc
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
  
  // 判断时间戳是秒级还是毫秒级
  // 如果小于13位数字，认为是秒级时间戳
  const isSecondTimestamp = timestamp.toString().length === 10
  const date = new Date(isSecondTimestamp ? timestamp * 1000 : timestamp)
  
  return date.toLocaleString('zh-CN')
}

const formatFollowerCount = (count) => {
  if (!count) return '0'
  if (count >= 10000) {
    return (count / 10000).toFixed(1) + 'w'
  }
  return count.toString()
}

const formatInvestmentAmount = (amount) => {
  if (!amount || amount <= 0) return '0.00'
  return parseFloat(amount).toLocaleString('zh-CN', {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2
  })
}

const getTruncatedVideoId = (videoId) => {
  if (!videoId || videoId === 'N/A') return 'N/A'
  return videoId.toString().length > 10 ? videoId.toString().substring(0, 10) : videoId.toString()
}

// 判断是否有72小时内的热度异动
const isRecentHotspotAlert = (row) => {
  const latestHotspotAlertTime = row.monitorVideo?.latestHotspotAlertTime
  if (!latestHotspotAlertTime) return false
  
  try {
    // 计算72小时前的时间戳
    const seventyTwoHoursAgo = new Date()
    seventyTwoHoursAgo.setTime(seventyTwoHoursAgo.getTime() - 72 * 60 * 60 * 1000)
    
    // 解析最后提醒时间
    const alertTime = new Date(latestHotspotAlertTime)
    
    // 如果最后提醒时间大于72小时前，则认为是最近的热度异动
    return alertTime > seventyTwoHoursAgo
  } catch (error) {
    console.warn('解析热度异动时间失败:', error)
    return false
  }
}

// UTC+8时区时间格式化函数
const formatToUTC8TimeString = (date = new Date()) => {
  // 转换到UTC+8时区
  const utc8Date = new Date(date.getTime() + (8 * 60 * 60 * 1000))
  const year = utc8Date.getUTCFullYear()
  const month = String(utc8Date.getUTCMonth() + 1).padStart(2, '0')
  const day = String(utc8Date.getUTCDate()).padStart(2, '0')
  const hours = String(utc8Date.getUTCHours()).padStart(2, '0')
  const minutes = String(utc8Date.getUTCMinutes()).padStart(2, '0')
  const seconds = String(utc8Date.getUTCSeconds()).padStart(2, '0')
  return `${year}-${month}-${day} ${hours}:${minutes}:${seconds}`
}

// 获取当前本地时间的格式化函数（用户本地时区）
const getBeijingTime = () => {
  const now = new Date()
  // 直接使用本地时间，不做时区转换
  const year = now.getFullYear()
  const month = String(now.getMonth() + 1).padStart(2, '0')
  const day = String(now.getDate()).padStart(2, '0')
  const hours = String(now.getHours()).padStart(2, '0')
  const minutes = String(now.getMinutes()).padStart(2, '0')
  return `${year}-${month}-${day}T${hours}:${minutes}`
}

// 将后端时间转换为本地时间显示格式
const convertToBeijingTimeString = (timeString) => {
  if (!timeString) return getBeijingTime()
  
  try {
    // 直接使用后端返回的时间，只做格式转换
    const date = new Date(timeString)
    if (isNaN(date.getTime())) {
      console.warn('无效的时间格式:', timeString)
      return getBeijingTime()
    }
    
    // 直接格式化为本地时间显示
    const year = date.getFullYear()
    const month = String(date.getMonth() + 1).padStart(2, '0')
    const day = String(date.getDate()).padStart(2, '0')
    const hours = String(date.getHours()).padStart(2, '0')
    const minutes = String(date.getMinutes()).padStart(2, '0')
    return `${year}-${month}-${day}T${hours}:${minutes}`
  } catch (error) {
    console.warn('时间转换失败:', error)
    return getBeijingTime()
  }
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

const loadMonitorVideos = async (page = 1) => {
  loading.value = true
  
  // 检查是否有音乐ID，新接口需要musicId作为必填参数
  if (!currentMusicId.value) {
    ElMessage.warning('请先选择要查看的音乐监控')
    loading.value = false
    // 重定向到音乐管理页面让用户选择音乐
    router.push('/music')
    return
  }
  
  try {
    // 构建查询参数
    const params = {
      musicId: currentMusicId.value,
      pageNum: page,
      pageSize: pageSize.value
    }
    
    // 添加搜索条件
    if (searchKeyword.value) {
      // 根据搜索内容判断是视频ID、链接还是播主名称
      const keyword = searchKeyword.value.trim()
      if (/^\d+$/.test(keyword)) {
        params.videoId = keyword
      } else if (keyword.includes('douyin.com') || keyword.includes('iesdouyin.com')) {
        params.videoUrl = keyword
      } else {
        params.authorName = keyword
      }
    }
    
    // 添加标签和频道筛选 - 直接传递数组，让axios处理序列化
    if (selectedSearchTags.value.length > 0) {
      params.tag = selectedSearchTags.value
    }
    if (selectedSearchChannels.value.length > 0) {
      params.channel = selectedSearchChannels.value
    }
    
    // 添加类型筛选
    if (currentFilter.value === 'manual') {
      params.type = 1
    } else if (currentFilter.value === 'auto') {
      params.joinCustomType = 1
    }
    
    // 添加状态筛选
    if (currentFilter.value === 'error') {
      // 异常监控：后端API中status=0表示所有异常状态
      params.status = 0
    } else if (currentFilter.value === 'all') {
      // 当前监控视频：只显示正常状态的视频
      params.status = 1
    }
    
    // 添加排序参数
    const sortFieldMap = {
      'diggCount': 'digg_count',
      'publishTime': 'video_publish_time', 
      'createTime': 'create_time'
    }
    params.sortBy = sortFieldMap[sortField.value] || 'create_time'
    params.sortOrder = sortOrder.value.toUpperCase()
    
    // 添加72H热度异动相关参数
    if (showHotspotFilter.value) {
      // 设置72小时前为开始时间（UTC+8）
      const seventyTwoHoursAgo = new Date()
      seventyTwoHoursAgo.setTime(seventyTwoHoursAgo.getTime() - 72 * 60 * 60 * 1000)
      params.startTime = formatToUTC8TimeString(seventyTwoHoursAgo)
      
      // 设置当前时间为结束时间（UTC+8）
      const now = new Date()
      params.endTime = formatToUTC8TimeString(now)
    }
    
    console.log('Monitor页面: 查询参数:', params)
    
    // 获取监控列表
    const response = await monitorApi.getMonitorList(params)
    console.log('Monitor页面: 监控列表API响应:', response)
    
    if (response.code === 200) {
      const responseData = response.data || {}
      const data = responseData.list || []
      
      console.log('Monitor页面: 新接口响应数据:', responseData)
      console.log('Monitor页面: 监控列表数据:', data)
      
      // 更新分页信息
      currentPage.value = responseData.pageNum || 1
      total.value = responseData.total || 0
      
      // 转换新接口数据结构为前端期望的格式
      const convertedData = data.map(item => ({
        // 构造与旧版本兼容的数据结构
        monitorVideo: {
          id: item.monitorVideoId,
          awemeId: item.videoId,
          videoUrl: item.videoUrl,
          musicId: item.musicId,
          status: item.status,
          type: item.type,
          createTime: item.createTime,
          videoPublishTime: item.videoPublishTime, // 保持原始时间戳格式
          tag: item.searchTags,
          channel: item.searchChannel,
          remark: item.remark, // 添加视频备注字段
          totalInvestmentAmount: item.totalInvestmentAmount, // 添加投资总金额字段
          joinCustomType: item.joinCustomType, // 添加自选类型字段
          latestHotspotAlertTime: item.latestHotspotAlertTime // 添加最后提醒时间字段
        },
        videoInfo: {
          desc: item.videoDescription,
          authorId: item.authorId, // 使用后端返回的authorId
          topics: item.topicTags ? JSON.parse(item.topicTags) : []
        },
        authorInfo: {
          nickname: item.authorName,
          followerCount: item.followerCount,
          authorId: item.authorId // 同时在authorInfo中也保存authorId
        },
        latestStats: {
          diggCount: item.latestDiggCount,
          commentCount: item.latestCommentCount
        },
        // 保留原有字段用于兼容
        userMonitor: {
          musicId: item.musicId
        }
      }))
      
      console.log('Monitor页面: 转换后的数据:', convertedData)
      
      // 如果需要获取当前音乐信息用于页面标题显示
      if (currentMusicId.value && !currentMusicInfo.value) {
        try {
          const musicResponse = await musicApi.getMusicById(currentMusicId.value)
          if (musicResponse.code === 200) {
            currentMusicInfo.value = musicResponse.data
          }
        } catch (musicError) {
          console.warn('获取音乐信息失败:', musicError)
        }
      }
      
      // 直接使用转换后的数据，后端API已根据参数筛选
      monitorList.value = convertedData
      
      // 加载统计数据和标签频道数据（只在第一页加载时更新）
      if (page === 1) {
        await loadStatistics()
        await loadTagsAndChannels()
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
  
  // 检查是否有当前音乐ID
  if (!currentMusicId.value) {
    ElMessage.warning('请先选择要监控的音乐')
    return
  }
  
  addLoading.value = true
  try {
    const response = await monitorApi.addMonitor({
      videoUrl: addForm.value.videoUrl.trim(),
      musicId: currentMusicId.value
    })
    
    if (response.code === 200) {
      ElMessage.success('添加监控成功')
      showAddDialog.value = false
      addForm.value = {
        videoUrl: '',
        file: null
      }
      await loadMonitorVideos()
      await loadStatistics()
      await loadTagsAndChannels()
    } else {
      // 根据API文档的具体错误信息进行处理
      if (response.message?.includes('音乐ID不能为空，音乐为必选项')) {
        ElMessage.error('音乐为必选项，请先选择音乐')
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



// 重置添加表单
const resetAddForm = () => {
  addForm.value = {
    videoUrl: '',
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
  // 检查是否有当前音乐ID
  if (!currentMusicId.value) {
    ElMessage.warning('请先选择要监控的音乐')
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
    formData.append('musicId', currentMusicId.value.toString())
    
    console.log('开始上传Excel文件:', {
      fileName: addForm.value.file.name,
      fileSize: addForm.value.file.size,
      musicId: currentMusicId.value
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
        errorMessage = '音乐为必选项，请先选择音乐'
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
          
          // 任务完成后刷新监控列表和统计
          if (taskData.status === 'COMPLETED') {
            await loadMonitorVideos()
            await loadStatistics()
            await loadTagsAndChannels()
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
    currentStatsAwemeId.value = awemeId
    showStatsDialog.value = true
    loadStatsData()
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
      await loadStatistics()
      await loadTagsAndChannels()
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
      await loadStatistics()
      await loadTagsAndChannels()
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
    await loadStatistics()
    await loadTagsAndChannels()
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
    await loadStatistics()
    await loadTagsAndChannels()
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

// 统计相关函数
const formatStatsNumber = (num) => {
  if (!num) return '0'
  if (num >= 10000) {
    return (num / 10000).toFixed(1) + 'w'
  }
  return num.toString()
}

// 解析时间字符串格式 "yyyy MM-dd HH:mm" 为时间戳
const parseTimeString = (timeStr) => {
  if (!timeStr) return Date.now()
  
  try {
    // 处理 "yyyy MM-dd HH:mm" 格式
    // 例如: "2024 12-25 14:30"
    const parts = timeStr.split(' ')
    if (parts.length === 3) {
      const year = parts[0]
      const dateTime = parts[1] + ' ' + parts[2]
      const fullDateTime = `${year}-${dateTime}`
      return new Date(fullDateTime).getTime()
    }
    
    // 如果格式不匹配，尝试直接解析
    return new Date(timeStr).getTime()
  } catch (error) {
    console.error('时间解析失败:', timeStr, error)
    return Date.now()
  }
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
    const response = await videoApi.getLatestVideoStats(currentStatsAwemeId.value)
    if (response.code === 200) {
      latestStats.value = response.data
    }
  } catch (error) {
    console.error('加载最新统计失败:', error)
  }
}

const loadStatsChart = async () => {
  try {
    const response = await videoApi.getVideoStatsChart(currentStatsAwemeId.value, statsDays.value)
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
  
  // 根据选中状态构建系列数据
  const series = []
  
  if (selectedStats.value.likes) {
    series.push({
      name: '点赞数',
      type: 'line',
      data: (data.diggCounts || []).map((value, index) => [parseTimeString(data.timestamps[index]), value]),
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
      data: (data.commentCounts || []).map((value, index) => [parseTimeString(data.timestamps[index]), value]),
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
      data: (data.collectCounts || []).map((value, index) => [parseTimeString(data.timestamps[index]), value]),
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
      data: (data.shareCounts || []).map((value, index) => [parseTimeString(data.timestamps[index]), value]),
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
          // value 是时间戳，显示更详细的时间信息
          const date = new Date(value)
          const month = (date.getMonth() + 1).toString().padStart(2, '0')
          const day = date.getDate().toString().padStart(2, '0')
          const hours = date.getHours().toString().padStart(2, '0')
          return `${month}-${day} ${hours}:00`
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

const loadStatsData = async () => {
  statsLoading.value = true
  try {
    await Promise.all([
      loadLatestStats(),
      loadStatsChart()
    ])
  } finally {
    statsLoading.value = false
  }
}

const closeStatsDialog = () => {
  showStatsDialog.value = false
  currentStatsAwemeId.value = null
  latestStats.value = null
  chartOption.value = null
  chartData.value = null
  statsDays.value = '7'
  // 重置选中状态
  selectedStats.value = {
    likes: true,
    comments: true,
    collects: true,
    shares: true
  }
}

// 播主信息相关函数
const formatAuthorNumber = (num) => {
  if (!num) return '0'
  if (num >= 10000) {
    return (num / 10000).toFixed(1) + 'w'
  }
  return num.toString()
}

const loadAuthorInfo = async (userId) => {
  authorLoading.value = true
  try {
    const response = await authorApi.getAuthorInfo(userId)
    if (response.code === 200) {
      currentAuthor.value = response.data
    } else {
      ElMessage.error('获取播主信息失败')
      currentAuthor.value = null
    }
  } catch (error) {
    console.error('获取播主信息失败:', error)
    ElMessage.error('获取播主信息失败')
    currentAuthor.value = null
  } finally {
    authorLoading.value = false
  }
}

const closeAuthorDialog = () => {
  showAuthorDialog.value = false
  currentAuthor.value = null
}

// 加入自选相关函数
const openCustomSelectionDialog = async (row) => {
  currentMonitorVideo.value = row
  
  // 先显示对话框，避免等待时间过长
  showCustomDialog.value = true
  
  // 重置表单，预填充视频备注
  investmentForm.value = {
    description: row.monitorVideo?.remark || '',
    amounts: [] // 初始化为空数组，等待加载投资记录
  }
  
  // 异步加载投资记录
  const awemeId = row.monitorVideo?.awemeId
  if (awemeId) {
    investmentRecordsLoading.value = true
    try {
      console.log('加载投资记录，视频ID:', awemeId)
      const response = await monitorApi.getVideoInvestments(awemeId)
      if (response.code === 200 && response.data && response.data.length > 0) {
        // 将后端返回的投资记录转换为前端表单格式
        const investmentAmounts = response.data.map(item => ({
          id: item.id,
          amount: item.amount,
          investmentTime: item.investmentTime ? convertToBeijingTimeString(item.investmentTime) : getBeijingTime()
        }))
        
        // 更新表单数据
        investmentForm.value.amounts = investmentAmounts
        console.log('成功加载投资记录:', investmentAmounts)
      } else {
        console.log('该视频暂无投资记录')
      }
    } catch (error) {
      console.warn('加载投资记录失败:', error)
      // 加载失败时保持默认的空记录
    } finally {
      investmentRecordsLoading.value = false
    }
  }
}

const closeCustomDialog = () => {
  showCustomDialog.value = false
  currentMonitorVideo.value = null
  investmentRecordsLoading.value = false
  investmentForm.value = {
    description: '',
    amounts: [
      {
        id: null,
        amount: null,
        investmentTime: getBeijingTime()
      }
    ]
  }
}

const addInvestmentAmount = () => {
  investmentForm.value.amounts.push({
    id: null,
    amount: null,
    investmentTime: getBeijingTime()
  })
}

const addFirstInvestmentAmount = () => {
  // 添加第一条投资记录
  investmentForm.value.amounts = [{
    id: null,
    amount: null,
    investmentTime: getBeijingTime()
  }]
}

const removeInvestmentAmount = (index) => {
  investmentForm.value.amounts.splice(index, 1)
}

const submitCustomSelection = async () => {
  if (!currentMonitorVideo.value?.monitorVideo?.id) {
    ElMessage.error('监控视频ID无效')
    return
  }
  
  // 验证表单 - 视频备注可以不填，投资记录也可以不填，但不能都为空
  const hasValidAmount = investmentForm.value.amounts.some(item => 
    item.amount && item.amount > 0 && item.investmentTime
  )
  
  const hasDescription = investmentForm.value.description && investmentForm.value.description.trim()
  
  // 如果既没有备注也没有投资记录，给出提示但允许提交（只要选择了加入自选）
  if (!hasValidAmount && !hasDescription) {
    // 只是加入自选状态，不需要必须填写备注或投资记录
    console.log('用户选择加入自选，但未填写备注或投资记录')
  }
  
  customSelectionLoading.value = true
  
  try {
    const requestData = {
      monitorVideoId: currentMonitorVideo.value.monitorVideo.id,
      joinCustomType: 1,
      description: investmentForm.value.description?.trim() || '',
      investmentAmounts: investmentForm.value.amounts
        .filter(item => item.amount && item.amount > 0 && item.investmentTime)
        .map(item => ({
          id: item.id,
          amount: parseFloat(item.amount),
          investmentTime: item.investmentTime + ':00' // 添加秒数
        }))
    }
    
    const result = await monitorApi.updateCustomSelection(requestData)
    
    if (result.code === 200) {
      const isUpdate = currentMonitorVideo.value?.monitorVideo?.joinCustomType === 1
      ElMessage.success(isUpdate ? '更新自选成功' : '加入自选成功')
      closeCustomDialog()
      // 刷新列表数据
      await loadMonitorVideos(currentPage.value)
    } else {
      const isUpdate = currentMonitorVideo.value?.monitorVideo?.joinCustomType === 1
      ElMessage.error(result.message || (isUpdate ? '更新自选失败' : '加入自选失败'))
    }
  } catch (error) {
    console.error('加入自选失败:', error)
    ElMessage.error('网络错误，请重试')
  } finally {
    customSelectionLoading.value = false
  }
}

const cancelCustomSelection = async () => {
  if (!currentMonitorVideo.value?.monitorVideo?.id) {
    ElMessage.error('监控视频ID无效')
    return
  }
  
  try {
    await ElMessageBox.confirm(
      '确定要取消该视频的自选状态吗？',
      '确认取消',
      {
        confirmButtonText: '确定',
        cancelButtonText: '取消',
        type: 'warning'
      }
    )
    
    customSelectionLoading.value = true
    
    const requestData = {
      monitorVideoId: currentMonitorVideo.value.monitorVideo.id,
      joinCustomType: 0,
      description: '',
      investmentAmounts: []
    }
    
    const result = await monitorApi.updateCustomSelection(requestData)
    
    if (result.code === 200) {
      ElMessage.success('取消自选成功')
      closeCustomDialog()
      // 刷新列表数据
      await loadMonitorVideos(currentPage.value)
    } else {
      ElMessage.error(result.message || '取消自选失败')
    }
  } catch (error) {
    if (error !== 'cancel') {
      console.error('取消自选失败:', error)
      ElMessage.error('网络错误，请重试')
    }
  } finally {
    customSelectionLoading.value = false
  }
}

const clearMusicFilter = () => {
  currentMusicId.value = null
  ElMessage.success('已清除音乐过滤')
}

const goBackFromMusic = () => {
  // 检查是否来自热度提醒页面
  if (route.query.from === 'hotspot') {
    // 构建热度提醒页面的路径和查询参数
    const hotspotQuery = {}
    
    // 如果有音乐ID，传递给热度提醒页面
    if (currentMusicId.value) {
      hotspotQuery.musicId = currentMusicId.value
    }
    
    router.push({ 
      path: '/hotspot', 
      query: hotspotQuery
    })
  } else {
    // 默认返回音乐管理页面
    router.push('/music')
  }
}

const goToAuthor = (row) => {
  const userId = row?.videoInfo?.authorId || row?.authorInfo?.authorId
  if (userId) {
    showAuthorDialog.value = true
    loadAuthorInfo(userId)
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






onMounted(async () => {
  // 检查是否有音乐ID查询参数
  if (route.query.musicId) {
    currentMusicId.value = parseInt(route.query.musicId)
    // 拉取音乐名称用于标题显示
    try {
      const res = await musicApi.getMusicById(currentMusicId.value)
      if (res?.code === 200) {
        currentMusicInfo.value = res.data
      }
    } catch (error) {
      console.warn('获取音乐信息失败:', error)
    }
    
    // 同时加载统计数据和标签频道数据
    await loadStatistics()
    await loadTagsAndChannels()
  }
  
  // 恢复保存的页面状态
  if (route.query.searchKeyword) {
    searchKeyword.value = route.query.searchKeyword
  }
  if (route.query.selectedSearchTags) {
    try {
      selectedSearchTags.value = JSON.parse(route.query.selectedSearchTags)
    } catch (e) {
      console.warn('解析selectedSearchTags失败:', e)
    }
  }
  if (route.query.selectedSearchChannels) {
    try {
      selectedSearchChannels.value = JSON.parse(route.query.selectedSearchChannels)
    } catch (e) {
      console.warn('解析selectedSearchChannels失败:', e)
    }
  }
  if (route.query.currentFilter) {
    currentFilter.value = route.query.currentFilter
  }
  if (route.query.sortField) {
    sortField.value = route.query.sortField
  }
  if (route.query.sortOrder) {
    sortOrder.value = route.query.sortOrder
  }
  if (route.query.currentPage) {
    currentPage.value = parseInt(route.query.currentPage)
  }
  if (route.query.pageSize) {
    pageSize.value = parseInt(route.query.pageSize)
  }
  
  // 恢复热度异动相关状态
  if (route.query.showHotspotFilter) {
    showHotspotFilter.value = route.query.showHotspotFilter === 'true'
  }
  if (route.query.startTime) {
    startTime.value = route.query.startTime
  }
  if (route.query.endTime) {
    endTime.value = route.query.endTime
  }
  
  await loadMonitorVideos(currentPage.value)
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

.menu-item .el-menu-item__content {
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
  margin: 0;
  color: #666;
  font-size: 14px;
  line-height: 1.6;
}

.page-desc {
  margin: 0;
  color: #666;
  font-size: 14px;
  line-height: 1.6;
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

/* 普通模式的搜索控件样式 */
.normal-search-controls {
  display: flex;
  align-items: center;
}

/* 热度异动模式的搜索控件样式 */
.hotspot-search-controls {
  display: flex;
  align-items: center;
  gap: 12px;
  flex-wrap: wrap;
}

.hotspot-search-controls .time-range-controls {
  display: flex;
  gap: 8px;
  align-items: center;
  padding: 6px 12px;
  background-color: #f8fafc;
  border: 1px solid #e2e8f0;
  border-radius: 6px;
}

.hotspot-search-controls .time-separator {
  color: #6b7280;
  font-size: 13px;
  font-weight: 500;
  margin: 0 2px;
}

.stats-row {
  display: grid;
  grid-template-columns: repeat(5, 1fr);
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

.stat-card.hotspot .stat-icon {
  background: linear-gradient(135deg, #f59e0b 0%, #fbbf24 100%);
  color: #fff;
  box-shadow: 0 2px 8px rgba(245, 158, 11, 0.3);
  transition: all 0.3s ease;
}

.stat-card.hotspot .stat-icon .el-icon {
  color: #ffffff !important;
  filter: drop-shadow(0 1px 2px rgba(0, 0, 0, 0.3));
  font-weight: bold;
}

.stat-card.hotspot:hover .stat-icon {
  background: linear-gradient(135deg, #d97706 0%, #f59e0b 100%);
  box-shadow: 0 4px 12px rgba(245, 158, 11, 0.4);
  transform: scale(1.05);
}

.stat-card.hotspot:hover .stat-icon .el-icon {
  filter: drop-shadow(0 2px 4px rgba(0, 0, 0, 0.4));
}

.stat-card.manual .stat-icon {
  background: linear-gradient(135deg, #6366f1 0%, #8b8df5 100%);
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
  background: linear-gradient(135deg, #10b981 0%, #34d399 100%);
  color: #fff;
  box-shadow: 0 2px 8px rgba(16, 185, 129, 0.3);
  transition: all 0.3s ease;
}

.stat-card.auto .stat-icon .el-icon {
  color: #ffffff !important;
  filter: drop-shadow(0 1px 2px rgba(0, 0, 0, 0.3));
  font-weight: bold;
}

.stat-card.auto:hover .stat-icon {
  background: linear-gradient(135deg, #059669 0%, #10b981 100%);
  box-shadow: 0 4px 12px rgba(16, 185, 129, 0.4);
  transform: scale(1.05);
}

.stat-card.auto:hover .stat-icon .el-icon {
  filter: drop-shadow(0 2px 4px rgba(0, 0, 0, 0.4));
}

.stat-card.is-active {
  border: 2px solid rgba(99, 102, 241, 0.35);
  box-shadow: 0 6px 16px rgba(99, 102, 241, 0.18);
}

.stat-card.auto.is-active {
  border: 2px solid rgba(16, 185, 129, 0.4);
  box-shadow: 0 6px 16px rgba(16, 185, 129, 0.2);
  background: linear-gradient(135deg, rgba(236, 253, 245, 0.5) 0%, rgba(209, 250, 229, 0.3) 100%);
}

.stat-card.hotspot.is-active {
  border: 2px solid rgba(245, 158, 11, 0.4);
  box-shadow: 0 6px 16px rgba(245, 158, 11, 0.2);
  background: linear-gradient(135deg, rgba(255, 251, 235, 0.5) 0%, rgba(254, 243, 199, 0.3) 100%);
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
  cursor: pointer;
}

.video-id-link:hover {
  color: var(--el-color-primary-dark-2);
  text-decoration: underline;
}

.video-id-text {
  font-family: 'Consolas', 'Monaco', monospace;
  font-weight: 600;
  color: #374151;
}

/* 自选视频容器样式 */
.custom-video-container {
  display: flex;
  align-items: center;
  gap: 4px;
  padding: 2px 6px;
  background: linear-gradient(135deg, #d1fae5 0%, #ecfdf5 100%);
  border: 1px solid #a7f3d0;
  border-radius: 6px;
  transition: all 0.2s ease;
}

.custom-video-container:hover {
  background: linear-gradient(135deg, #a7f3d0 0%, #d1fae5 100%);
  border-color: #6ee7b7;
  transform: translateY(-1px);
  box-shadow: 0 2px 4px rgba(16, 185, 129, 0.15);
}

/* 72H热度异动视频容器样式 */
.hotspot-video-container {
  display: flex;
  align-items: center;
  gap: 4px;
  padding: 2px 6px;
  background: linear-gradient(135deg, #fef3c7 0%, #fffbeb 100%);
  border: 1px solid #fbbf24;
  border-radius: 6px;
  transition: all 0.2s ease;
  position: relative;
  overflow: hidden;
}

.hotspot-video-container::before {
  content: '';
  position: absolute;
  top: 0;
  left: 0;
  right: 0;
  height: 2px;
  background: linear-gradient(90deg, #f59e0b 0%, #fbbf24 50%, #f59e0b 100%);
  animation: hotspotGlow 2s ease-in-out infinite alternate;
}

@keyframes hotspotGlow {
  0% {
    opacity: 0.6;
  }
  100% {
    opacity: 1;
  }
}

.hotspot-video-container:hover {
  background: linear-gradient(135deg, #fbbf24 0%, #fef3c7 100%);
  border-color: #f59e0b;
  transform: translateY(-1px);
  box-shadow: 0 4px 8px rgba(251, 191, 36, 0.25);
}

.hotspot-video-icon {
  color: #f59e0b;
  flex-shrink: 0;
  filter: drop-shadow(0 1px 2px rgba(245, 158, 11, 0.3));
}

/* 72H热度异动视频ID样式 */
.hotspot-video-id {
  color: #b45309 !important;
  font-weight: 700 !important;
  text-shadow: 0 1px 2px rgba(180, 83, 9, 0.1);
}

.hotspot-video-id:hover {
  color: #92400e !important;
  text-decoration: underline;
}

.custom-video-icon {
  color: #059669;
  flex-shrink: 0;
}

/* 自选视频的视频ID绿色样式 */
.custom-video-id {
  color: #059669 !important;
  font-weight: 700 !important;
}

.custom-video-id:hover {
  color: #047857 !important;
  text-decoration: underline;
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

.hashtag-list {
  display: flex;
  flex-wrap: wrap;
  gap: 4px;
  align-items: center;
}

.hashtag-tag {
  border: none;
  background: #f0f9ff;
  color: #0369a1;
  font-size: 11px;
  padding: 2px 6px;
  border-radius: 4px;
}

.hashtag-more {
  border: none;
  background: #f3f4f6;
  color: #6b7280;
  font-size: 11px;
  padding: 2px 6px;
  border-radius: 4px;
  cursor: pointer;
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
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}

.create-time {
  font-size: 12px;
  color: #374151;
  line-height: 1.4;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}

/* 搜索标签样式 */
.search-tag-list {
  display: flex;
  flex-wrap: wrap;
  gap: 4px;
  align-items: center;
}

.search-tag {
  border: none;
  background: #f0f9ff;
  color: #059669;
  font-size: 11px;
  padding: 2px 6px;
  border-radius: 4px;
  cursor: pointer;
  transition: all 0.2s ease;
}

.search-tag:hover {
  background: #dcfce7;
  color: #047857;
  transform: scale(1.05);
}

.search-tag-more {
  border: none;
  background: #f3f4f6;
  color: #6b7280;
  font-size: 11px;
  padding: 2px 6px;
  border-radius: 4px;
  cursor: pointer;
}

/* 搜索类型样式 */
.search-channel-list {
  display: flex;
  flex-wrap: wrap;
  gap: 4px;
  align-items: center;
}

.search-channel {
  border: none;
  background: #fefce8;
  color: #ca8a04;
  font-size: 11px;
  padding: 2px 6px;
  border-radius: 4px;
  cursor: pointer;
  transition: all 0.2s ease;
}

.search-channel:hover {
  background: #fef3c7;
  color: #a16207;
  transform: scale(1.05);
}

/* 最后提醒时间样式 */
.latest-alert-time {
  display: flex;
  justify-content: center;
  align-items: center;
}

.alert-time {
  font-size: 12px;
  color: #f59e0b;
  font-weight: 500;
  white-space: nowrap;
}

.alert-time:hover {
  color: #d97706;
}

.search-channel-more {
  border: none;
  background: #f3f4f6;
  color: #6b7280;
  font-size: 11px;
  padding: 2px 6px;
  border-radius: 4px;
  cursor: pointer;
}

/* 视频备注样式 */
.video-remark {
  max-width: 100%;
  line-height: 1.4;
}

.remark-text {
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

/* 投资总金额样式 */
.total-investment {
  text-align: right;
  line-height: 1.4;
}

.investment-amount {
  font-size: 13px;
  font-weight: 600;
  color: #059669;
  font-family: 'Consolas', 'Monaco', monospace;
}

/* 标签筛选区域样式 */
.tag-filter-section {
  background: #fff;
  border-radius: 12px;
  border: 1px solid #e6e8eb;
  padding: 20px 24px;
  margin-bottom: 16px;
}

.tag-filter-row {
  display: flex;
  align-items: center;
  gap: 16px;
  flex-wrap: wrap;
}

.tag-filter-title {
  font-size: 16px;
  font-weight: 600;
  color: #1f2937;
  white-space: nowrap;
  flex-shrink: 0;
}

.clear-tags-btn {
  color: #f56565;
  font-size: 14px;
  padding: 0;
  white-space: nowrap;
  flex-shrink: 0;
}

.clear-tags-btn:hover {
  color: #e53e3e;
}

.tag-filter-content {
  display: flex;
  flex-direction: column;
  gap: 16px;
  flex: 1;
  min-width: 0;
}

.filter-group {
  display: flex;
  flex-wrap: wrap;
  gap: 12px;
  align-items: center;
}

.filter-group-title {
  font-size: 14px;
  font-weight: 500;
  color: #374151;
  white-space: nowrap;
  flex-shrink: 0;
  margin-right: 8px;
}

.filter-tag {
  cursor: pointer;
  transition: all 0.3s ease;
  font-size: 14px;
  padding: 8px 12px;
  border-radius: 6px;
  user-select: none;
}

.filter-tag:hover {
  transform: translateY(-1px);
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
}

.tag-count {
  font-size: 12px;
  margin-left: 4px;
  opacity: 0.8;
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

/* 分页样式 */
.pagination-container {
  display: flex;
  justify-content: center;
  padding: 20px 0;
  border-top: 1px solid #f1f3f4;
  margin-top: 16px;
}

.pagination {
  background: transparent;
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

/* 视频描述样式 */
.video-desc {
  max-width: 100%;
  line-height: 1.4;
}

.desc-text {
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

/* 音乐信息显示样式 */
.music-info-display {
  padding: 16px;
  background: #f8fafc;
  border-radius: 8px;
  border: 1px solid #e2e8f0;
}

.music-title {
  font-size: 16px;
  font-weight: 600;
  color: #1f2937;
  margin-bottom: 8px;
}

.music-album, .music-tags {
  font-size: 14px;
  color: #6b7280;
  margin-bottom: 4px;
}

.music-tags {
  margin-bottom: 0;
  display: flex;
  align-items: center;
  gap: 8px;
  flex-wrap: wrap;
}

.music-tag {
  margin: 0;
  background-color: #e6f7ff;
  border-color: #91d5ff;
  color: #1890ff;
}

.music-tag:hover {
  background-color: #bae7ff;
  border-color: #69c0ff;
}

/* 统计对话框样式 */
.stats-dialog-content {
  padding: 0;
}

.stats-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 20px;
  padding: 0 4px;
}

.video-info {
  display: flex;
  align-items: center;
  gap: 8px;
}

.video-id-label {
  font-size: 16px;
  font-weight: 500;
  color: #6b7280;
}

.video-id-value {
  font-size: 16px;
  font-weight: 600;
  color: #1f2937;
  font-family: 'Consolas', 'Monaco', monospace;
}

.time-range-selector {
  display: flex;
  align-items: center;
}

.stats-content {
  min-height: 500px;
}

.stats-grid {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(280px, 1fr));
  gap: 20px;
  margin-bottom: 24px;
}

.stats-dialog-content .stat-card {
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

.stats-dialog-content .stat-card:hover {
  box-shadow: 0 8px 25px rgba(0, 0, 0, 0.1);
  transform: translateY(-4px);
}

.stats-dialog-content .stat-card.is-active {
  border: 2px solid rgba(99, 102, 241, 0.35);
  box-shadow: 0 6px 16px rgba(99, 102, 241, 0.18);
  transform: translateY(-2px);
}

.stats-dialog-content .stat-card.is-active:hover {
  box-shadow: 0 8px 25px rgba(99, 102, 241, 0.25);
  transform: translateY(-4px);
}

.stats-dialog-content .stat-card::before {
  content: '';
  position: absolute;
  top: 0;
  left: 0;
  right: 0;
  height: 4px;
  background: var(--gradient);
}

.stats-dialog-content .stat-card.likes {
  --gradient: linear-gradient(135deg, #ff6b9d 0%, #e74c8c 100%);
}

.stats-dialog-content .stat-card.comments {
  --gradient: linear-gradient(135deg, #4ecdc4 0%, #44a08d 100%);
}

.stats-dialog-content .stat-card.collects {
  --gradient: linear-gradient(135deg, #45b7d1 0%, #2c5aa0 100%);
}

.stats-dialog-content .stat-card.shares {
  --gradient: linear-gradient(135deg, #f9ca24 0%, #f0932b 100%);
}

.stats-dialog-content .stat-icon {
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

.stats-dialog-content .stat-card.is-active .stat-icon {
  transform: scale(1.05);
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.2);
}

.stats-dialog-content .stat-info {
  flex: 1;
}

.stats-dialog-content .stat-value {
  font-size: 32px;
  font-weight: 800;
  color: #1f2937;
  line-height: 1.2;
  margin-bottom: 4px;
  transition: color 0.3s ease;
}

.stats-dialog-content .stat-label {
  font-size: 16px;
  color: #6b7280;
  font-weight: 500;
  margin-bottom: 8px;
  transition: color 0.3s ease;
}

.stats-dialog-content .stat-trend {
  display: flex;
  align-items: center;
  gap: 4px;
  font-size: 14px;
  font-weight: 600;
}

.stats-dialog-content .trend-up {
  color: #10b981;
}

.stats-dialog-content .trend-down {
  color: #ef4444;
}

.stats-dialog-content .chart-card {
  border-radius: 16px;
  border: 1px solid #e6e8eb;
  overflow: hidden;
}

.stats-dialog-content .card-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
}

.stats-dialog-content .card-title {
  font-size: 18px;
  font-weight: 600;
  color: #1f2937;
}

.stats-dialog-content .chart-legend {
  display: flex;
  gap: 20px;
  align-items: center;
}

.stats-dialog-content .legend-item {
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

.stats-dialog-content .legend-item:hover {
  background: rgba(99, 102, 241, 0.1);
  color: #6366f1;
}

.stats-dialog-content .legend-item.legend-disabled {
  opacity: 0.4;
  color: #9ca3af;
}

.stats-dialog-content .legend-item.legend-disabled:hover {
  opacity: 0.6;
  background: rgba(156, 163, 175, 0.1);
}

.stats-dialog-content .legend-dot {
  width: 12px;
  height: 12px;
  border-radius: 50%;
  transition: all 0.2s ease;
}

.stats-dialog-content .likes-dot {
  background: #ff6b9d;
}

.stats-dialog-content .comments-dot {
  background: #4ecdc4;
}

.stats-dialog-content .collects-dot {
  background: #45b7d1;
}

.stats-dialog-content .shares-dot {
  background: #f9ca24;
}

.stats-dialog-content .chart-container {
  padding: 20px 0;
}

.stats-dialog-content .empty-chart {
  height: 400px;
  display: flex;
  align-items: center;
  justify-content: center;
}

.heart-icon-large {
  display: flex;
  align-items: center;
  justify-content: center;
  color: #ffffff;
  filter: drop-shadow(0 1px 2px rgba(0, 0, 0, 0.1));
}

/* 播主信息对话框样式 */
.author-info-dialog {
  padding: 0;
}

.author-info-dialog .el-descriptions {
  margin-top: 0;
}

.author-info-dialog .author-link {
  word-break: break-all;
  line-height: 1.4;
}

:deep(.author-info-dialog .el-descriptions__label) {
  font-weight: 600;
  color: #374151;
  background-color: #f9fafb;
}

:deep(.author-info-dialog .el-descriptions__content) {
  color: #111827;
}

/* 加入自选对话框样式 */
.custom-selection-content {
  padding: 0;
}

.video-info-section {
  margin-bottom: 24px;
}

.video-info-section h4 {
  margin: 0 0 12px 0;
  font-size: 16px;
  font-weight: 600;
  color: #1f2937;
}

.video-title {
  line-height: 1.4;
  color: #374151;
  word-break: break-word;
  max-height: 60px;
  overflow: hidden;
  display: -webkit-box;
  -webkit-box-orient: vertical;
  -webkit-line-clamp: 3;
}

.description-section {
  margin-bottom: 24px;
}

.description-section h4 {
  margin: 0 0 12px 0;
  font-size: 16px;
  font-weight: 600;
  color: #1f2937;
}

.investment-section {
  margin-bottom: 16px;
}

.investment-section h4 {
  margin: 0 0 16px 0;
  font-size: 16px;
  font-weight: 600;
  color: #1f2937;
}

.investment-item {
  margin-bottom: 16px;
  padding: 16px;
  border: 1px solid #e5e7eb;
  border-radius: 8px;
  background: #f9fafb;
}

.investment-row {
  display: flex;
  align-items: flex-end;
  gap: 16px;
}

.amount-input {
  flex: 1;
}

.time-input {
  flex: 1;
}

.action-buttons {
  display: flex;
  gap: 8px;
  margin-bottom: 18px;
}

:deep(.investment-item .el-form-item) {
  margin-bottom: 0;
}

:deep(.investment-item .el-form-item__label) {
  font-weight: 500;
  color: #374151;
}

.loading-tip {
  display: flex;
  align-items: center;
  gap: 8px;
  padding: 16px;
  color: #6b7280;
  font-size: 14px;
  background: #f9fafb;
  border-radius: 6px;
  margin-bottom: 16px;
}

.no-investment-records {
  display: flex;
  justify-content: center;
  align-items: center;
  padding: 32px;
  background: #f9fafb;
  border: 2px dashed #e5e7eb;
  border-radius: 8px;
  margin-bottom: 16px;
}

.add-investment-btn {
  padding: 12px 24px;
  font-size: 14px;
  border-radius: 8px;
}


</style>