<template>
  <div class="favorite-layout">
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
          <el-menu-item index="/favorite-author" class="menu-item">
            <el-icon><Star /></el-icon>
            <span>收藏播主</span>
          </el-menu-item>
        </el-menu>
      </nav>

      <!-- 主内容区 -->
      <main class="content">
        <div class="page-header">
          <h2 class="page-title">收藏播主</h2>
          <p class="page-desc">管理您收藏的播主，查看播主详细信息</p>
        </div>

        <!-- 操作栏 -->
        <div class="toolbar">
          <div class="toolbar-left">
            <el-button type="primary" @click="loadFavoriteList" :icon="Refresh" :loading="loading">
              刷新列表
            </el-button>
            <el-button type="default" @click="resetFilters" size="default">
              重置筛选
            </el-button>
          </div>
          <div class="toolbar-right">
            <div class="search-filter-container">
              <!-- 搜索框 -->
              <el-input
                v-model="searchKeyword"
                placeholder="搜索播主昵称、描述或标签"
                :prefix-icon="Search"
                style="width: 280px;"
                clearable
                @input="handleSearch"
              />
              
              <!-- 筛选条件 -->
              <el-select 
                v-model="filters.channelType" 
                placeholder="全部类型"
                clearable
                style="width: 130px;"
                @change="handleFilterChange"
              >
                <el-option label="美食" value="美食" />
                <el-option label="美妆" value="美妆" />
                <el-option label="时尚" value="时尚" />
                <el-option label="娱乐" value="娱乐" />
                <el-option label="音乐" value="音乐" />
                <el-option label="舞蹈" value="舞蹈" />
                <el-option label="游戏" value="游戏" />
                <el-option label="科技" value="科技" />
                <el-option label="教育" value="教育" />
                <el-option label="旅游" value="旅游" />
                <el-option label="汽车" value="汽车" />
                <el-option label="体育" value="体育" />
                <el-option label="生活" value="生活" />
                <el-option label="搞笑" value="搞笑" />
                <el-option label="知识" value="知识" />
                <el-option label="直播" value="直播" />
                <el-option label="其他" value="其他" />
              </el-select>
              
              <el-select 
                v-model="filters.authorLevel" 
                placeholder="全部等级"
                clearable
                style="width: 100px;"
                @change="handleFilterChange"
              >
                <el-option label="普通" :value="1" />
                <el-option label="优质" :value="2" />
                <el-option label="顶级" :value="3" />
              </el-select>
              
              <el-select 
                v-model="filters.sortBy" 
                style="width: 120px;"
                @change="handleFilterChange"
              >
                <el-option label="收藏时间" value="create_time" />
                <el-option label="粉丝数" value="fans_count" />
                <el-option label="获赞数" value="digg_count" />
                <el-option label="播主等级" value="author_level" />
              </el-select>
              
              <el-select 
                v-model="filters.sortOrder" 
                style="width: 80px;"
                @change="handleFilterChange"
              >
                <el-option label="降序" value="DESC" />
                <el-option label="升序" value="ASC" />
              </el-select>
            </div>
          </div>
        </div>

        <!-- 音乐标签筛选 -->
        <div v-if="musicStatistics.length > 0" class="tag-filter-section">
          <div class="tag-filter-row">
            <div class="tag-filter-content">
              <div class="filter-group">
                <span class="filter-group-title">按音乐筛选：</span>
                <el-tag
                  v-for="music in musicStatistics"
                  :key="music.musicId"
                  size="large"
                  :type="filters.musicId === music.musicId ? 'primary' : 'info'"
                  :effect="filters.musicId === music.musicId ? 'dark' : 'light'"
                  class="filter-tag"
                  @click="selectMusicFilter(music.musicId)"
                >
                  {{ music.musicTitle }}
                  <span class="tag-count">
                    ({{ music.favoriteCount }})
                  </span>
                </el-tag>
              </div>
            </div>
            <el-button 
              v-if="filters.musicId" 
              type="text" 
              size="small" 
              @click="clearMusicFilter"
              class="clear-tags-btn"
            >
              清除筛选 (1)
            </el-button>
          </div>
        </div>

        <!-- 收藏播主列表 -->
        <el-card class="favorite-table-card">
          <template #header>
            <div class="card-header">
              <span class="card-title">收藏播主列表</span>
            </div>
          </template>
          
          <div v-loading="loading">
            <div v-if="filteredFavoriteList.length === 0 && !loading" class="empty-container">
              <el-empty description="暂无收藏播主">
                <template #description>
                  <span>您还没有收藏任何播主</span>
                  <br>
                  <small>可以在播主详情页面进行收藏</small>
                </template>
              </el-empty>
            </div>
            <el-table 
              v-else
              :data="filteredFavoriteList" 
              stripe
              style="width: 100%"
            >
              <el-table-column prop="authorAvatar" label="头像" width="80" align="center">
                <template #default="{ row }">
                  <el-avatar 
                    :size="40" 
                    :src="row.authorAvatar"
                    @click="viewAuthorDetail(row)"
                    class="avatar-clickable"
                  >
                    <el-icon><UserFilled /></el-icon>
                  </el-avatar>
                </template>
              </el-table-column>
              
              <el-table-column prop="authorNickname" label="昵称" min-width="80">
                <template #default="{ row }">
                  <div class="nickname-cell">
                    <span 
                      class="nickname-link" 
                      :style="{ backgroundColor: row.backgroundColor || 'transparent' }"
                      @click="viewAuthorDetail(row)"
                    >
                      {{ row.authorNickname || 'N/A' }}
                    </span>
                  </div>
                </template>
              </el-table-column>
              
              <el-table-column prop="authorDesc" label="描述" min-width="200">
                <template #default="{ row }">
                  <el-tooltip
                    v-if="row.authorDesc"
                    :content="row.authorDesc"
                    placement="top-start"
                    :disabled="row.authorDesc.length <= 80"
                    effect="dark"
                    :show-after="300"
                  >
                    <div class="desc-cell">
                      {{ row.authorDesc }}
                    </div>
                  </el-tooltip>
                  <div v-else class="desc-cell">
                    暂无描述
                  </div>
                </template>
              </el-table-column>
              
              <el-table-column prop="followerCount" label="粉丝数" width="100" align="right">
                <template #default="{ row }">
                  <span class="stat-number">{{ formatNumber(row.followerCount) }}</span>
                </template>
              </el-table-column>
              
              <el-table-column prop="totalFavorited" label="获赞数" width="100" align="right">
                <template #default="{ row }">
                  <span class="stat-number">{{ formatNumber(row.totalFavorited) }}</span>
                </template>
              </el-table-column>
              
              <el-table-column prop="channelType" label="类型" width="100" align="center">
                <template #default="{ row }">
                  <el-tag v-if="row.channelType" size="small" type="primary">
                    {{ row.channelType }}
                  </el-tag>
                  <span v-else>-</span>
                </template>
              </el-table-column>
              
              <el-table-column prop="authorLevel" label="播主等级" width="100" align="center">
                <template #default="{ row }">
                  <el-tag 
                    v-if="row.authorLevel" 
                    :type="getAuthorLevelType(row.authorLevel)" 
                    size="small"
                  >
                    {{ getAuthorLevelText(row.authorLevel) }}
                  </el-tag>
                  <span v-else>-</span>
                </template>
              </el-table-column>
              
              <el-table-column prop="musicNames" label="相关音乐" min-width="80">
                <template #default="{ row }">
                  <div class="music-cell">
                    <el-tooltip
                      v-if="row.musicNames && row.musicNames.length > 0"
                      :content="row.musicNames.join('、')"
                      placement="top-start"
                      :disabled="row.musicNames.length <= 3"
                      effect="dark"
                      :show-after="300"
                    >
                      <div class="music-tags">
                        <el-tag
                          v-for="(music, index) in row.musicNames.slice(0, 3)"
                          :key="index"
                          size="small"
                          type="success"
                          class="music-tag"
                        >
                          {{ music }}
                        </el-tag>
                        <span v-if="row.musicNames.length > 3" class="more-music">
                          +{{ row.musicNames.length - 3 }}
                        </span>
                      </div>
                    </el-tooltip>
                    <span v-else class="no-music">暂无音乐</span>
                  </div>
                </template>
              </el-table-column>
              
              <el-table-column prop="totalInvestmentAmount" label="投资总额" width="100">
                <template #default="{ row }">
                  <span v-if="row.totalInvestmentAmount" class="investment-amount">
                    ¥{{ formatInvestmentAmount(row.totalInvestmentAmount) }}
                  </span>
                  <span v-else class="no-investment">-</span>
                </template>
              </el-table-column>
              
              <el-table-column prop="remark" label="备注" min-width="200">
                <template #default="{ row }">
                  <div class="remark-cell">
                    <span v-if="row.remark" class="remark-text">
                      {{ row.remark }}
                    </span>
                    <span v-else class="no-remark">暂无备注</span>
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
                @current-change="handlePageChange"
              />
            </div>
          </div>
        </el-card>
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

    <!-- 编辑播主设置对话框 -->
    <el-dialog
      v-model="showEditSettingsDialog"
      title="编辑播主设置"
      width="500px"
      :close-on-click-modal="false"
    >
      <el-form :model="editForm" label-width="100px" :rules="editFormRules" ref="editFormRef">
        <el-form-item label="播主昵称">
          <el-input :value="currentEditAuthor?.authorNickname || ''" disabled />
        </el-form-item>
        
        <el-form-item label="频道类型" prop="channelType">
          <el-select 
            v-model="editForm.channelType" 
            placeholder="请选择频道类型"
            style="width: 100%"
            clearable
            filterable
            allow-create
          >
            <el-option label="美食" value="美食" />
            <el-option label="美妆" value="美妆" />
            <el-option label="时尚" value="时尚" />
            <el-option label="娱乐" value="娱乐" />
            <el-option label="音乐" value="音乐" />
            <el-option label="舞蹈" value="舞蹈" />
            <el-option label="游戏" value="游戏" />
            <el-option label="科技" value="科技" />
            <el-option label="教育" value="教育" />
            <el-option label="旅游" value="旅游" />
            <el-option label="汽车" value="汽车" />
            <el-option label="体育" value="体育" />
            <el-option label="生活" value="生活" />
            <el-option label="搞笑" value="搞笑" />
            <el-option label="知识" value="知识" />
            <el-option label="其他" value="其他" />
          </el-select>
        </el-form-item>
        
        <el-form-item label="播主等级" prop="authorLevel">
          <el-radio-group v-model="editForm.authorLevel">
            <el-radio :value="1">普通</el-radio>
            <el-radio :value="2">优质</el-radio>
            <el-radio :value="3">顶级</el-radio>
          </el-radio-group>
        </el-form-item>
        
        <el-form-item label="背景颜色" prop="backgroundColor">
          <div class="color-selection-container">
            <div class="color-palette">
              <div class="color-group">
                <div class="group-label">选择背景颜色</div>
                <div class="color-row">
                  <div 
                    v-for="color in ['#E3F2FD', '#FFF3E0', '#E8F5E8', '#FCE4EC', '#F3E5F5', '#FFFDE7', '#E0F7FA', '#FFF8E1', '#EFEBE9', '#F1F8E9']" 
                    :key="color"
                    class="color-option" 
                    :class="{ active: editForm.backgroundColor === color }"
                    :style="{ backgroundColor: color }"
                    @click="editForm.backgroundColor = color"
                    :title="color"
                  ></div>
                </div>
              </div>
            </div>
            
            <div class="selected-color-display" v-if="editForm.backgroundColor">
              <span class="selected-label">已选择：</span>
              <div 
                class="selected-color-preview" 
                :style="{ backgroundColor: editForm.backgroundColor }"
                :title="editForm.backgroundColor"
              ></div>
              <span class="selected-value">{{ editForm.backgroundColor }}</span>
              <el-button size="small" text @click="editForm.backgroundColor = ''">清除</el-button>
            </div>
          </div>
        </el-form-item>
        
        <el-form-item label="备注信息" prop="remark">
          <el-input
            v-model="editForm.remark"
            type="textarea"
            :rows="3"
            placeholder="请输入备注信息，如：优质美食博主"
            maxlength="200"
            show-word-limit
          />
        </el-form-item>
      </el-form>
      
      <template #footer>
        <el-button @click="closeEditSettingsDialog">取消</el-button>
        <el-button type="primary" @click="confirmEditSettings" :loading="editSettingsLoading">
          保存设置
        </el-button>
      </template>
    </el-dialog>

    <!-- 播主信息对话框 -->
    <el-dialog
      v-model="showAuthorDetailDialog"
      title="播主信息"
      width="600px"
      :close-on-click-modal="false"
    >
      <div v-loading="authorDetailLoading">
        <div v-if="currentDetailAuthor" class="author-info-dialog">
          <!-- 播主头像区域 -->
          <div class="author-avatar-section">
            <el-avatar 
              :src="currentDetailAuthor.authorAvatar" 
              :size="80"
              class="author-avatar"
            >
              <el-icon><User /></el-icon>
            </el-avatar>
            <div class="author-basic-info">
              <h3>{{ currentDetailAuthor.nickname || '未知播主' }}</h3>
              <p class="user-id">{{ currentDetailAuthor.userId || 'N/A' }}</p>
              
              <!-- 收藏信息标签（仅在已收藏时显示） -->
              <div v-if="authorIsFavorited && currentFavoriteInfo" class="favorite-tags">
                <el-tag v-if="currentFavoriteInfo.totalInvestmentAmount" type="success" size="small" class="info-tag investment-tag">
                  投资总额: ¥{{ formatInvestmentAmount(currentFavoriteInfo.totalInvestmentAmount) }}
                </el-tag>
                <el-tag v-if="currentFavoriteInfo.channelType" type="primary" size="small" class="info-tag">
                  {{ currentFavoriteInfo.channelType }}
                </el-tag>
                <el-tag 
                  v-if="currentFavoriteInfo.authorLevel" 
                  :type="getAuthorLevelType(currentFavoriteInfo.authorLevel)" 
                  size="small"
                  class="info-tag"
                >
                  {{ getAuthorLevelText(currentFavoriteInfo.authorLevel) }}
                </el-tag>
                <div v-if="currentFavoriteInfo.backgroundColor" class="color-tag">
                  <div 
                    class="color-indicator" 
                    :style="{ backgroundColor: currentFavoriteInfo.backgroundColor }"
                    :title="currentFavoriteInfo.backgroundColor"
                  ></div>
                </div>
              </div>
              
              <div class="author-stats">
                <span class="stat-item">
                  <el-icon><User /></el-icon>
                  {{ formatAuthorNumber(currentDetailAuthor.followerCount) }} 粉丝
                </span>
                <span class="stat-item">
                  <el-icon><Star /></el-icon>
                  {{ formatAuthorNumber(currentDetailAuthor.totalFavorited) }} 获赞
                </span>
              </div>
            </div>
          </div>
          
          <!-- 详细信息区域 -->
          <div v-if="currentDetailAuthor.userDesc || currentDetailAuthor.userUrl || (authorIsFavorited && currentFavoriteInfo?.remark)" class="author-details">
            <el-descriptions :column="1" border>
              <el-descriptions-item v-if="currentDetailAuthor.userDesc" label="播主描述">
                <div class="author-description">{{ currentDetailAuthor.userDesc }}</div>
              </el-descriptions-item>
              <el-descriptions-item v-if="currentDetailAuthor.userUrl" label="播主地址">
                <el-link 
                  type="primary" 
                  :href="currentDetailAuthor.userUrl" 
                  target="_blank"
                  class="author-link"
                >
                  {{ currentDetailAuthor.userUrl }}
                </el-link>
              </el-descriptions-item>
              
              <!-- 只显示备注信息 -->
              <el-descriptions-item v-if="authorIsFavorited && currentFavoriteInfo?.remark" label="备注信息">
                <div class="remark-display">
                  {{ currentFavoriteInfo.remark }}
                </div>
              </el-descriptions-item>
            </el-descriptions>
          </div>
        </div>
        <el-empty v-else-if="!authorDetailLoading" description="暂无播主信息" />
      </div>
      
      <template #footer>
        <el-button @click="closeAuthorDetailDialog">关闭</el-button>
        <el-button 
          v-if="authorIsFavorited && currentDetailAuthor?.userId"
          type="warning"
          :icon="Edit"
          @click="editAuthorFromDialog"
        >
          编辑设置
        </el-button>
        <el-button 
          v-if="currentDetailAuthor?.userId"
          :type="authorIsFavorited ? 'danger' : 'primary'"
          :loading="favoriteLoading"
          @click="toggleAuthorFavorite"
        >
          {{ authorIsFavorited ? '取消收藏' : '收藏播主' }}
        </el-button>
      </template>
    </el-dialog>

    <!-- 播主设置对话框 -->
    <el-dialog
      v-model="showAuthorSettingDialog"
      title="收藏播主设置"
      width="500px"
      :close-on-click-modal="false"
    >
      <el-form :model="authorSettingForm" label-width="100px" :rules="authorSettingRules" ref="authorSettingFormRef">
        <el-form-item label="播主昵称">
          <el-input :value="currentDetailAuthor?.nickname || ''" disabled />
        </el-form-item>
        
        <el-form-item label="频道类型" prop="channelType">
          <el-select 
            v-model="authorSettingForm.channelType" 
            placeholder="请选择频道类型"
            style="width: 100%"
            clearable
            filterable
            allow-create
          >
            <el-option label="美食" value="美食" />
            <el-option label="美妆" value="美妆" />
            <el-option label="时尚" value="时尚" />
            <el-option label="娱乐" value="娱乐" />
            <el-option label="音乐" value="音乐" />
            <el-option label="舞蹈" value="舞蹈" />
            <el-option label="游戏" value="游戏" />
            <el-option label="科技" value="科技" />
            <el-option label="教育" value="教育" />
            <el-option label="旅游" value="旅游" />
            <el-option label="汽车" value="汽车" />
            <el-option label="体育" value="体育" />
            <el-option label="生活" value="生活" />
            <el-option label="搞笑" value="搞笑" />
            <el-option label="知识" value="知识" />
            <el-option label="其他" value="其他" />
          </el-select>
        </el-form-item>
        
        <el-form-item label="播主级别" prop="authorLevel">
          <el-radio-group v-model="authorSettingForm.authorLevel">
            <el-radio :value="1">普通</el-radio>
            <el-radio :value="2">优质</el-radio>
            <el-radio :value="3">顶级</el-radio>
          </el-radio-group>
        </el-form-item>
        
        <el-form-item label="背景颜色" prop="backgroundColor">
          <div class="color-selection-container">
            <div class="color-palette">
              <div class="color-group">
                <div class="group-label">选择背景颜色</div>
                <div class="color-row">
                  <div 
                    v-for="color in ['#E3F2FD', '#FFF3E0', '#E8F5E8', '#FCE4EC', '#F3E5F5', '#FFFDE7', '#E0F7FA', '#FFF8E1', '#EFEBE9', '#F1F8E9']" 
                    :key="color"
                    class="color-option" 
                    :class="{ active: authorSettingForm.backgroundColor === color }"
                    :style="{ backgroundColor: color }"
                    @click="authorSettingForm.backgroundColor = color"
                    :title="color"
                  ></div>
                </div>
              </div>
            </div>
            
            <div class="selected-color-display" v-if="authorSettingForm.backgroundColor">
              <span class="selected-label">已选择：</span>
              <div 
                class="selected-color-preview" 
                :style="{ backgroundColor: authorSettingForm.backgroundColor }"
                :title="authorSettingForm.backgroundColor"
              ></div>
              <span class="selected-value">{{ authorSettingForm.backgroundColor }}</span>
              <el-button size="small" text @click="authorSettingForm.backgroundColor = ''">清除</el-button>
            </div>
          </div>
        </el-form-item>
        
        <el-form-item label="备注信息" prop="remark">
          <el-input
            v-model="authorSettingForm.remark"
            type="textarea"
            :rows="3"
            placeholder="请输入备注信息，如：优质美食博主"
            maxlength="200"
            show-word-limit
          />
        </el-form-item>
      </el-form>
      
      <template #footer>
        <el-button @click="closeAuthorSettingDialog">取消</el-button>
        <el-button type="primary" @click="confirmAuthorSetting" :loading="favoriteLoading">
          确认收藏
        </el-button>
      </template>
    </el-dialog>
  </div>
</template>

<script setup>
import { ref, computed, onMounted } from 'vue'
import { useRouter } from 'vue-router'
import { useAuthStore } from '@/store/auth'
import { favoriteApi } from '@/api/favorite'
import { authApi } from '@/api/auth'
import { authorApi } from '@/api/author'
import { ElMessage, ElMessageBox } from 'element-plus'
import {
  Refresh,
  Search,
  Delete,
  Edit,
  View,
  Star,
  Headset,
  ArrowDown,
  UserFilled,
  User
} from '@element-plus/icons-vue'

const router = useRouter()
const authStore = useAuthStore()

const loading = ref(false)
const favoriteList = ref([])
const favoriteCount = ref(0)
const searchKeyword = ref('')
const removingId = ref(null)
const musicStatistics = ref([])
const musicStatisticsLoading = ref(false)

// 分页相关
const currentPage = ref(1)
const pageSize = ref(10)
const total = ref(0)

// 筛选和排序相关
const filters = ref({
  channelType: '',
  authorLevel: null,
  sortBy: 'create_time',
  sortOrder: 'DESC',
  musicId: null
})

// 更新邮箱对话框
const showUpdateEmailDialog = ref(false)
const updateEmailLoading = ref(false)
const emailForm = ref({ email: '' })

// 播主详情弹出框相关
const showAuthorDetailDialog = ref(false)
const authorDetailLoading = ref(false)
const currentDetailAuthor = ref(null)
const favoriteLoading = ref(false)
const authorIsFavorited = ref(false)
const currentFavoriteInfo = ref(null)

// 搜索功能 - 服务端搜索
const filteredFavoriteList = computed(() => {
  // 直接返回favoriteList，因为搜索已经在服务端完成
  return Array.isArray(favoriteList.value) ? favoriteList.value : []
})

const formatDate = (dateStr) => {
  if (!dateStr) return 'N/A'
  return new Date(dateStr).toLocaleString('zh-CN')
}

const formatNumber = (num) => {
  if (num == null) return 'N/A'
  const number = parseInt(num)
  if (number >= 10000) {
    return (number / 10000).toFixed(1) + 'w'
  }
  return number.toString()
}

// 获取播主等级类型
const getAuthorLevelType = (level) => {
  switch (level) {
    case 1: return 'info'    // 普通
    case 2: return 'success' // 优质  
    case 3: return 'warning' // 顶级
    default: return 'info'
  }
}

// 获取播主等级文本
const getAuthorLevelText = (level) => {
  switch (level) {
    case 1: return '普通'
    case 2: return '优质'
    case 3: return '顶级'
    default: return '未知'
  }
}

const loadFavoriteList = async () => {
  if (!authStore.user?.id) {
    ElMessage.error('用户信息不完整，请重新登录')
    return
  }
  
  loading.value = true
  try {
    // 构建筛选参数
    const filterParams = {
      channelType: filters.value.channelType || undefined,
      authorLevel: filters.value.authorLevel || undefined,
      sortBy: filters.value.sortBy,
      sortOrder: filters.value.sortOrder,
      keyword: searchKeyword.value || undefined,
      musicId: filters.value.musicId || undefined
    }
    
    const response = await favoriteApi.getFavoriteList(
      currentPage.value, 
      pageSize.value, 
      filterParams
    )
    
    if (response.success) {
      // 适配新的分页响应结构
      const data = response.data
      const list = Array.isArray(data.list) ? data.list : []
      
      // 处理 musicNames 字段，将字符串解析为数组
      const processedList = list.map(item => ({
        ...item,
        musicNames: item.musicNames ? (() => {
          try {
            return typeof item.musicNames === 'string' 
              ? JSON.parse(item.musicNames) 
              : item.musicNames
          } catch (e) {
            console.warn('解析 musicNames 失败:', e)
            return []
          }
        })() : []
      }))
      
      favoriteList.value = processedList
      total.value = data.total || 0
      favoriteCount.value = data.total || 0
    } else {
      ElMessage.error(response.message || '加载收藏列表失败')
      favoriteList.value = []
      total.value = 0
      favoriteCount.value = 0
    }
  } catch (error) {
    console.error('加载收藏列表失败:', error)
    ElMessage.error('加载收藏列表失败')
    favoriteList.value = []
    total.value = 0
    favoriteCount.value = 0
  } finally {
    loading.value = false
  }
}

// 分页处理
const handlePageChange = (page) => {
  currentPage.value = page
  loadFavoriteList()
}

const handleSizeChange = (size) => {
  pageSize.value = size
  currentPage.value = 1
  loadFavoriteList()
}

// 筛选处理
const handleFilterChange = () => {
  currentPage.value = 1
  loadFavoriteList()
}

// 重置筛选条件
const resetFilters = () => {
  filters.value = {
    channelType: '',
    authorLevel: null,
    sortBy: 'create_time',
    sortOrder: 'DESC',
    musicId: null
  }
  searchKeyword.value = ''
  currentPage.value = 1
  loadFavoriteList()
}

// 加载音乐统计数据
const loadMusicStatistics = async () => {
  musicStatisticsLoading.value = true
  try {
    const response = await favoriteApi.getMusicStatistics()
    if (response.success) {
      musicStatistics.value = response.data || []
    } else {
      console.error('获取音乐统计失败:', response.message)
      musicStatistics.value = []
    }
  } catch (error) {
    console.error('获取音乐统计失败:', error)
    musicStatistics.value = []
  } finally {
    musicStatisticsLoading.value = false
  }
}

// 选择音乐筛选
const selectMusicFilter = (musicId) => {
  if (filters.value.musicId === musicId) {
    // 如果已选中，则取消选中
    filters.value.musicId = null
  } else {
    // 选中新的音乐
    filters.value.musicId = musicId
  }
  currentPage.value = 1
  loadFavoriteList()
}

// 清除音乐筛选
const clearMusicFilter = () => {
  filters.value.musicId = null
  currentPage.value = 1
  loadFavoriteList()
}

const removeFavorite = async (item) => {
  try {
    await ElMessageBox.confirm(
      `确认取消收藏播主"${item.authorNickname || 'N/A'}"？`, 
      '警告', 
      {
        type: 'warning',
        confirmButtonText: '确认取消',
        cancelButtonText: '取消'
      }
    )
    
    removingId.value = item.id
    // 使用 authorId
    const authorId = item.authorId
    if (!authorId) {
      ElMessage.error('播主ID不完整，无法取消收藏')
      return
    }
    
    const response = await favoriteApi.removeFavorite(authorId)
    if (response.success) {
      ElMessage.success('取消收藏成功')
      await loadFavoriteList()
    } else {
      ElMessage.error(response.message || '取消收藏失败')
    }
  } catch (error) {
    if (error !== 'cancel') {
      console.error('取消收藏失败:', error)
      ElMessage.error('取消收藏失败')
    }
  } finally {
    removingId.value = null
  }
}

const viewAuthorDetail = (author) => {
  // 修复：收藏播主列表中应该使用 authorId 而不是 authorUserId
  const authorId = author?.authorId
  if (authorId) {
    showAuthorDetailDialog.value = true
    loadAuthorDetailInfo(authorId)
  } else {
    ElMessage.warning('播主信息不完整')
  }
}

// 从播主详情对话框打开编辑设置
const editAuthorFromDialog = () => {
  if (!currentDetailAuthor.value) return
  
  // 构造与列表中相同的数据结构
  const favoriteItem = favoriteList.value.find(item => 
    item.authorId === currentDetailAuthor.value.id
  )
  
  if (favoriteItem) {
    editAuthorSettings(favoriteItem)
  } else {
    ElMessage.warning('未找到收藏信息，无法编辑')
  }
}

// 加载播主详情信息
const loadAuthorDetailInfo = async (authorId) => {
  authorDetailLoading.value = true
  try {
    const response = await favoriteApi.getFavoriteDetail(authorId)
    if (response.success) {
      currentDetailAuthor.value = {
        id: response.data.authorId, // 数据库主键ID
        userId: response.data.authorUserId,
        nickname: response.data.authorNickname,
        authorAvatar: response.data.authorAvatar,
        userDesc: response.data.authorDesc,
        userUrl: response.data.authorUrl,
        followerCount: response.data.followerCount,
        totalFavorited: response.data.totalFavorited
      }
      
      // 设置收藏状态和信息
      authorIsFavorited.value = response.data.id !== null
      if (authorIsFavorited.value) {
        currentFavoriteInfo.value = {
          channelType: response.data.channelType,
          authorLevel: response.data.authorLevel,
          backgroundColor: response.data.backgroundColor,
          remark: response.data.remark,
          totalInvestmentAmount: response.data.totalInvestmentAmount
        }
      } else {
        currentFavoriteInfo.value = null
      }
    } else {
      ElMessage.error(response.message || '获取播主信息失败')
      currentDetailAuthor.value = null
      authorIsFavorited.value = false
      currentFavoriteInfo.value = null
    }
  } catch (error) {
    console.error('获取播主信息失败:', error)
    ElMessage.error('获取播主信息失败')
    currentDetailAuthor.value = null
    authorIsFavorited.value = false
    currentFavoriteInfo.value = null
  } finally {
    authorDetailLoading.value = false
  }
}

// 关闭播主详情对话框
const closeAuthorDetailDialog = () => {
  showAuthorDetailDialog.value = false
  currentDetailAuthor.value = null
  authorIsFavorited.value = false
  currentFavoriteInfo.value = null
}

// 格式化播主数字（粉丝数、获赞数等）
const formatAuthorNumber = (num) => {
  if (!num) return '0'
  if (num >= 10000) {
    return (num / 10000).toFixed(1) + 'w'
  }
  return num.toString()
}

// 格式化投资金额
const formatInvestmentAmount = (amount) => {
  if (!amount || amount === 0) return '0'
  const num = parseFloat(amount)
  if (num >= 10000) {
    return (num / 10000).toFixed(1) + '万'
  }
  return num.toLocaleString('zh-CN', { minimumFractionDigits: 0, maximumFractionDigits: 2 })
}

const handleSearch = () => {
  // 触发服务端搜索
  currentPage.value = 1
  loadFavoriteList()
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

// 检查收藏状态
const checkFavoriteStatus = async (authorId) => {
  if (!authStore.user?.id) return
  
  try {
    const response = await favoriteApi.checkFavoriteStatus(authorId)
    if (response.success) {
      authorIsFavorited.value = response.isFavorite || false
    }
  } catch (error) {
    console.error('检查收藏状态失败:', error)
    authorIsFavorited.value = false
  }
}

// 检查收藏状态并获取收藏信息
const checkFavoriteStatusAndInfo = async (authorId) => {
  if (!authStore.user?.id) return
  
  try {
    const response = await favoriteApi.checkFavoriteStatus(authorId)
    if (response.success) {
      authorIsFavorited.value = response.isFavorite || false
      
      // 如果已收藏，从收藏列表中找到对应的收藏信息
      if (authorIsFavorited.value) {
        const favoriteItem = favoriteList.value.find(item => 
          item.authorId === authorId
        )
        
        if (favoriteItem) {
          currentFavoriteInfo.value = {
            channelType: favoriteItem.channelType,
            authorLevel: favoriteItem.authorLevel,
            backgroundColor: favoriteItem.backgroundColor,
            remark: favoriteItem.remark,
            totalInvestmentAmount: favoriteItem.totalInvestmentAmount
          }
        } else {
          currentFavoriteInfo.value = null
        }
      } else {
        currentFavoriteInfo.value = null
      }
    }
  } catch (error) {
    console.error('检查收藏状态失败:', error)
    authorIsFavorited.value = false
    currentFavoriteInfo.value = null
  }
}

// 切换收藏状态
const toggleAuthorFavorite = async () => {
  if (!currentDetailAuthor.value?.id || !authStore.user?.id) {
    ElMessage.error('用户或播主信息不完整')
    return
  }

  if (authorIsFavorited.value) {
    // 取消收藏
    favoriteLoading.value = true
    try {
      // 使用 authorId (即 currentDetailAuthor.value.id)
      if (!currentDetailAuthor.value.id) {
        ElMessage.error('播主ID不完整，无法取消收藏')
        return
      }
      
      const response = await favoriteApi.removeFavorite(currentDetailAuthor.value.id)
      if (response.success) {
        authorIsFavorited.value = false
        ElMessage.success('取消收藏成功')
        // 刷新收藏列表
        await loadFavoriteList()
      } else {
        ElMessage.error(response.message || '取消收藏失败')
      }
    } catch (error) {
      console.error('取消收藏失败:', error)
      ElMessage.error('取消收藏失败，请稍后重试')
    } finally {
      favoriteLoading.value = false
    }
  } else {
    // 添加收藏 - 弹出设置对话框
    openAuthorSettingDialog()
  }
}

// 打开播主设置对话框
const openAuthorSettingDialog = () => {
  // 重置表单
  authorSettingForm.value = {
    channelType: currentDetailAuthor.value?.channelType || '',
    authorLevel: currentDetailAuthor.value?.authorLevel || 1,
    backgroundColor: currentDetailAuthor.value?.backgroundColor || '',
    remark: ''
  }
  showAuthorSettingDialog.value = true
}

// 编辑播主设置对话框相关数据
const showEditSettingsDialog = ref(false)
const editFormRef = ref(null)
const editForm = ref({
  channelType: '',
  authorLevel: 1,
  backgroundColor: '',
  remark: ''
})
const currentEditAuthor = ref(null)
const editSettingsLoading = ref(false)

// 播主设置对话框相关数据
const showAuthorSettingDialog = ref(false)
const authorSettingFormRef = ref(null)
const authorSettingForm = ref({
  channelType: '',
  authorLevel: 1,
  backgroundColor: '',
  remark: ''
})

// 适合蓝色文字的背景颜色 - 优雅版
const backgroundColors = [
  '#E3F2FD', // 淡蓝色 - 与蓝字和谐
  '#FFF3E0', // 淡橙色 - 温暖对比
  '#E8F5E8', // 淡绿色 - 清新挂皮
  '#FCE4EC', // 淡粉色 - 温柔美观
  '#F3E5F5', // 淡紫色 - 优雅高级
  '#FFFDE7', // 淡黄色 - 明亮清晰
  '#E0F7FA', // 淡青色 - 清新自然
  '#FFF8E1', // 米白色 - 简洁大方
  '#EFEBE9', // 暖灰色 - 低调内敛
  '#F1F8E9'  // 淡绿白 - 清雅淡然
]

// 编辑表单验证规则
const editFormRules = {
  channelType: [
    { max: 50, message: '频道类型不能超过50个字符', trigger: 'blur' }
  ],
  backgroundColor: [
    { 
      validator: (rule, value, callback) => {
        if (!value || value.trim() === '') {
          callback()
          return
        }
        
        const hexPattern = /^#([A-Fa-f0-9]{3}|[A-Fa-f0-9]{6}|[A-Fa-f0-9]{8})$/
        const rgbPattern = /^rgba?\(\s*([01]?\d\d?|2[0-4]\d|25[0-5])\s*,\s*([01]?\d\d?|2[0-4]\d|25[0-5])\s*,\s*([01]?\d\d?|2[0-4]\d|25[0-5])\s*(?:,\s*(0(?:\.\d+)?|1(?:\.0+)?))?\s*\)$/
        
        if (!hexPattern.test(value) && !rgbPattern.test(value)) {
          callback(new Error('请输入有效的颜色代码，格式如：#FF0000 或 rgb(255, 0, 0)'))
        } else {
          callback()
        }
      }, 
      trigger: 'blur' 
    }
  ],
  remark: [
    { max: 200, message: '备注信息不能超过200个字符', trigger: 'blur' }
  ]
}

// 表单验证规则
const authorSettingRules = {
  channelType: [
    { max: 50, message: '频道类型不能超过50个字符', trigger: 'blur' }
  ],
  backgroundColor: [
    { 
      validator: (rule, value, callback) => {
        if (!value || value.trim() === '') {
          // 允许空值
          callback()
          return
        }
        
        // 支持十六进制格式 #RGB 或 #RRGGBB 或 #RRGGBBAA
        const hexPattern = /^#([A-Fa-f0-9]{3}|[A-Fa-f0-9]{6}|[A-Fa-f0-9]{8})$/
        
        // 支持RGB格式 rgb(255, 255, 255) 或 rgba(255, 255, 255, 0.5)
        const rgbPattern = /^rgba?\(\s*([01]?\d\d?|2[0-4]\d|25[0-5])\s*,\s*([01]?\d\d?|2[0-4]\d|25[0-5])\s*,\s*([01]?\d\d?|2[0-4]\d|25[0-5])\s*(?:,\s*(0(?:\.\d+)?|1(?:\.0+)?))?\s*\)$/
        
        if (!hexPattern.test(value) && !rgbPattern.test(value)) {
          callback(new Error('请输入有效的颜色代码，格式如：#FF0000 或 rgb(255, 0, 0)'))
        } else {
          callback()
        }
      }, 
      trigger: 'blur' 
    }
  ],
  remark: [
    { max: 200, message: '备注信息不能超过200个字符', trigger: 'blur' }
  ]
}

// 关闭播主设置对话框
const closeAuthorSettingDialog = () => {
  showAuthorSettingDialog.value = false
  authorSettingForm.value = {
    channelType: '',
    authorLevel: 1,
    backgroundColor: '',
    remark: ''
  }
}

// 编辑播主设置相关函数
const editAuthorSettings = (item) => {
  currentEditAuthor.value = item
  // 填充表单数据
  editForm.value = {
    channelType: item.channelType || '',
    authorLevel: item.authorLevel || 1,
    backgroundColor: item.backgroundColor || '',
    remark: item.remark || ''
  }
  showEditSettingsDialog.value = true
}

const closeEditSettingsDialog = () => {
  showEditSettingsDialog.value = false
  currentEditAuthor.value = null
  editForm.value = {
    channelType: '',
    authorLevel: 1,
    backgroundColor: '',
    remark: ''
  }
}

const confirmEditSettings = async () => {
  if (!editFormRef.value) return
  
  try {
    await editFormRef.value.validate()
  } catch (error) {
    return
  }

  if (!currentEditAuthor.value?.id) {
    ElMessage.error('播主信息不完整')
    return
  }

  editSettingsLoading.value = true
  try {
    const favoriteConfigData = {
      id: currentEditAuthor.value.id, // 使用收藏关系ID
      ...editForm.value
    }
    
    // 清理空值
    Object.keys(favoriteConfigData).forEach(key => {
      if (favoriteConfigData[key] === '' || favoriteConfigData[key] === null || favoriteConfigData[key] === undefined) {
        delete favoriteConfigData[key]
      }
    })

    const response = await favoriteApi.updateFavoriteConfig(favoriteConfigData)
    if (response.success) {
      showEditSettingsDialog.value = false
      ElMessage.success('收藏配置更新成功')
      closeEditSettingsDialog()
      await loadFavoriteList()
    } else {
      ElMessage.error(response.message || '收藏配置更新失败')
    }
  } catch (error) {
    console.error('更新收藏配置失败:', error)
    ElMessage.error('更新收藏配置失败，请稍后重试')
  } finally {
    editSettingsLoading.value = false
  }
}

// 确认播主设置并收藏
const confirmAuthorSetting = async () => {
  if (!authorSettingFormRef.value) return
  
  // 验证表单
  try {
    await authorSettingFormRef.value.validate()
  } catch (error) {
    return
  }

  if (!currentDetailAuthor.value?.id || !authStore.user?.id) {
    ElMessage.error('用户或播主信息不完整')
    return
  }

  favoriteLoading.value = true
  try {
    // 调用API添加收藏，携带额外参数
    const params = {
      authorId: currentDetailAuthor.value.id, // 使用 authorId
      ...authorSettingForm.value
    }
    
    // 清理空值
    Object.keys(params).forEach(key => {
      if (params[key] === '' || params[key] === null || params[key] === undefined) {
        delete params[key]
      }
    })

    const response = await favoriteApi.addFavoriteWithSettings(params)
    if (response.success) {
      authorIsFavorited.value = true
      showAuthorSettingDialog.value = false
      ElMessage.success('收藏成功')
      
      // 重置表单
      closeAuthorSettingDialog()
      // 刷新收藏列表
      await loadFavoriteList()
    } else {
      ElMessage.error(response.message || '收藏失败')
    }
  } catch (error) {
    console.error('收藏操作失败:', error)
    ElMessage.error('收藏失败，请稍后重试')
  } finally {
    favoriteLoading.value = false
  }
}

onMounted(() => {
  loadFavoriteList()
  loadMusicStatistics()
})
</script>

<style scoped>
.favorite-layout {
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

.stats-row {
  display: flex;
  gap: 20px;
  margin-bottom: 24px;
}

.stat-card {
  flex: 1;
  max-width: 300px;
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
  background: linear-gradient(135deg, #f093fb 0%, #f5576c 100%);
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

.toolbar {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 24px;
  padding: 16px 20px;
  background: #fff;
  border-radius: 12px;
  border: 1px solid #e6e8eb;
  flex-wrap: wrap;
  gap: 16px;
}

@media (max-width: 768px) {
  .toolbar {
    flex-direction: column;
    align-items: stretch;
  }
  
  .toolbar-left,
  .toolbar-right {
    justify-content: center;
  }
}

.toolbar-left {
  display: flex;
  gap: 12px;
}

.favorite-table-card {
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

.empty-container {
  padding: 40px;
  text-align: center;
}

.avatar-clickable {
  cursor: pointer;
  transition: opacity 0.3s ease;
}

.avatar-clickable:hover {
  opacity: 0.8;
}

.nickname-cell {
  display: flex;
  flex-direction: column;
  gap: 4px;
}

.nickname-link {
  color: #409eff;
  cursor: pointer;
  font-weight: 500;
  transition: all 0.3s ease;
  padding: 4px 8px;
  border-radius: 4px;
  display: inline-block;
}

.nickname-link:hover {
  color: #66b1ff;
  box-shadow: 0 1px 3px rgba(0, 0, 0, 0.1);
}


.desc-cell {
  color: #6b7280;
  line-height: 1.4;
  display: -webkit-box;
  -webkit-line-clamp: 2;
  -webkit-box-orient: vertical;
  overflow: hidden;
}

.stat-number {
  font-weight: 600;
  color: #374151;
}

.location-cell {
  display: flex;
  align-items: center;
  gap: 4px;
  color: #6b7280;
}

.time-text {
  color: #6b7280;
  font-size: 13px;
}

:deep(.el-card__header) {
  padding: 20px 24px;
  border-bottom: 1px solid #f0f0f0;
}

:deep(.el-card__body) {
  padding: 24px;
}


.music-cell {
  max-width: 150px;
}

.music-tags {
  display: flex;
  flex-direction: column;
  gap: 2px;
  align-items: flex-start;
}

.music-tag {
  font-size: 11px;
  padding: 2px 6px;
  margin: 0;
}

.more-music {
  font-size: 10px;
  color: #909399;
  font-weight: 500;
  margin-top: 2px;
}

.no-music {
  color: #9ca3af;
  font-size: 13px;
  font-style: italic;
}

.remark-cell {
  max-width: 200px;
}

.remark-text {
  color: #374151;
  font-size: 13px;
  line-height: 1.4;
  white-space: pre-wrap;
  display: -webkit-box;
  -webkit-line-clamp: 3;
  -webkit-box-orient: vertical;
  overflow: hidden;
}

.no-remark {
  color: #9ca3af;
  font-size: 13px;
  font-style: italic;
}

.investment-amount {
  font-weight: 600;
  color: #059669;
  font-size: 14px;
}

.no-investment {
  color: #9ca3af;
  font-size: 13px;
}
/* 播主设置对话框样式 */
.color-selection-container {
  width: 100%;
}

.color-palette {
  background: #f8f9fa;
  border: 1px solid #e9ecef;
  border-radius: 8px;
  padding: 16px;
  margin-bottom: 12px;
}

.color-group {
  margin-bottom: 12px;
}

.color-group:last-child {
  margin-bottom: 0;
}

.group-label {
  font-size: 12px;
  color: #6c757d;
  margin-bottom: 6px;
  font-weight: 500;
}

.color-row {
  display: flex;
  gap: 6px;
  flex-wrap: wrap;
}

.color-option {
  width: 28px;
  height: 28px;
  border-radius: 6px;
  border: 2px solid transparent;
  cursor: pointer;
  transition: all 0.2s ease;
  position: relative;
}

.color-option:hover {
  transform: scale(1.1);
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.15);
}

.color-option.active {
  border-color: #409eff;
  transform: scale(1.1);
  box-shadow: 0 0 0 2px rgba(64, 158, 255, 0.2);
}

.color-option.active::after {
  content: '✓';
  position: absolute;
  top: 50%;
  left: 50%;
  transform: translate(-50%, -50%);
  color: #fff;
  font-size: 12px;
  font-weight: bold;
  text-shadow: 0 1px 2px rgba(0, 0, 0, 0.5);
}

.selected-color-display {
  display: flex;
  align-items: center;
  gap: 8px;
  padding: 8px 12px;
  background: #f8f9fa;
  border: 1px solid #dee2e6;
  border-radius: 6px;
  font-size: 14px;
}

.selected-label {
  color: #495057;
  font-weight: 500;
}

.selected-color-preview {
  width: 20px;
  height: 20px;
  border-radius: 4px;
  border: 1px solid #dee2e6;
}

.selected-value {
  color: #6c757d;
  font-family: monospace;
  font-size: 13px;
}

:deep(.el-form-item__label) {
  font-weight: 500;
}

:deep(.el-radio-group) {
  display: flex;
  gap: 16px;
}

:deep(.el-select) {
  width: 100%;
}

/* 播主头像区域样式 */
.author-avatar-section {
  display: flex;
  align-items: flex-start;
  gap: 16px;
  margin-bottom: 20px;
  padding: 20px;
  background: linear-gradient(135deg, #f8fafc 0%, #f1f5f9 100%);
  border-radius: 12px;
  border: 1px solid #e2e8f0;
}

.author-avatar {
  flex-shrink: 0;
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.15);
}

.author-basic-info {
  flex: 1;
  min-width: 0;
}

.author-basic-info h3 {
  margin: 0 0 8px 0;
  font-size: 20px;
  font-weight: 600;
  color: #1e293b;
  word-break: break-word;
}

.author-basic-info .user-id {
  margin: 0 0 16px 0;
  color: #64748b;
  font-size: 14px;
  font-family: 'Monaco', 'Menlo', 'Ubuntu Mono', monospace;
}

.author-stats {
  display: flex;
  gap: 20px;
  flex-wrap: wrap;
}

.stat-item {
  display: flex;
  align-items: center;
  gap: 4px;
  padding: 6px 12px;
  background: rgba(255, 255, 255, 0.8);
  border-radius: 8px;
  font-size: 14px;
  font-weight: 500;
  color: #374151;
  border: 1px solid rgba(0, 0, 0, 0.1);
}

.stat-item .el-icon {
  font-size: 16px;
  color: #6b7280;
}

/* 详细信息区域样式 */
.author-details {
  margin-top: 16px;
}

.author-description {
  line-height: 1.6;
  color: #374151;
  word-break: break-word;
}

.author-link {
  word-break: break-all;
  line-height: 1.4;
}

/* 播主信息对话框样式 */
.author-info-dialog {
  padding: 0;
}

.author-info-dialog .el-descriptions {
  margin-top: 0;
}

:deep(.author-info-dialog .el-descriptions__label) {
  font-weight: 600;
  color: #374151;
  background-color: #f9fafb;
}

:deep(.author-info-dialog .el-descriptions__content) {
  color: #111827;
}

/* 分页样式 */
.pagination-container {
  display: flex;
  justify-content: center;
  margin-top: 20px;
  padding: 20px 0;
}

/* 搜索筛选容器样式 */
.search-filter-container {
  display: flex;
  align-items: center;
  gap: 12px;
  flex-wrap: wrap;
}

@media (max-width: 1200px) {
  .search-filter-container {
    gap: 8px;
  }
  
  .search-filter-container .el-input {
    width: 240px !important;
  }
  
  .search-filter-container .el-select {
    min-width: 80px;
  }
}

/* 收藏信息标签样式 */
.favorite-tags {
  display: flex;
  align-items: center;
  gap: 8px;
  margin: 8px 0;
  flex-wrap: wrap;
}

.info-tag {
  margin-right: 0 !important;
}

.investment-tag {
  background-color: #ecfccb !important;
  color: #365314 !important;
  border-color: #a3e635 !important;
  font-weight: 600;
}

.color-tag {
  display: inline-flex;
  align-items: center;
}

.color-indicator {
  width: 20px;
  height: 20px;
  border-radius: 4px;
  border: 1px solid #e5e7eb;
  box-shadow: 0 1px 2px rgba(0, 0, 0, 0.1);
  cursor: help;
}

/* 备注显示样式 */
.remark-display {
  line-height: 1.5;
  color: #374151;
  word-break: break-word;
  white-space: pre-wrap;
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
  opacity: 0.8;
  margin-left: 4px;
}
</style>