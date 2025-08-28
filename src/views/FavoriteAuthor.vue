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

        <!-- 统计信息 -->
        <div class="stats-row">
          <div class="stat-card total">
            <div class="stat-icon">
              <el-icon><Star /></el-icon>
            </div>
            <div class="stat-info">
              <div class="stat-value">{{ favoriteCount }}</div>
              <div class="stat-label">收藏播主总数</div>
            </div>
          </div>
        </div>

        <!-- 操作栏 -->
        <div class="toolbar">
          <div class="toolbar-left">
            <el-button type="primary" @click="loadFavoriteList" :icon="Refresh" :loading="loading">
              刷新列表
            </el-button>
          </div>
          <div class="toolbar-right">
            <el-input
              v-model="searchKeyword"
              placeholder="搜索播主昵称、描述或标签"
              :prefix-icon="Search"
              style="width: 300px;"
              clearable
              @input="handleSearch"
            />
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
              :default-sort="{ prop: 'createTime', order: 'descending' }"
            >
              <el-table-column prop="author.authorAvatar" label="头像" width="80" align="center">
                <template #default="{ row }">
                  <el-avatar 
                    :size="40" 
                    :src="row.author?.authorAvatar"
                    @click="viewAuthorDetail(row.author)"
                    class="avatar-clickable"
                  >
                    <el-icon><UserFilled /></el-icon>
                  </el-avatar>
                </template>
              </el-table-column>
              
              <el-table-column prop="author.nickname" label="昵称" min-width="120">
                <template #default="{ row }">
                  <div class="nickname-cell">
                    <span 
                      class="nickname-link" 
                      @click="viewAuthorDetail(row.author)"
                    >
                      {{ row.author?.nickname || 'N/A' }}
                    </span>
                    <div class="author-level" v-if="row.author?.authorLevel">
                      Lv.{{ row.author.authorLevel }}
                    </div>
                  </div>
                </template>
              </el-table-column>
              
              <el-table-column prop="author.userDesc" label="描述" min-width="200">
                <template #default="{ row }">
                  <div class="desc-cell">
                    {{ row.author?.userDesc || '暂无描述' }}
                  </div>
                </template>
              </el-table-column>
              
              <el-table-column prop="author.followerCount" label="粉丝数" width="100" align="right">
                <template #default="{ row }">
                  <span class="stat-number">{{ formatNumber(row.author?.followerCount) }}</span>
                </template>
              </el-table-column>
              
              <el-table-column prop="author.totalFavorited" label="获赞数" width="100" align="right">
                <template #default="{ row }">
                  <span class="stat-number">{{ formatNumber(row.author?.totalFavorited) }}</span>
                </template>
              </el-table-column>
              
              <el-table-column prop="author.channelType" label="类型" width="100" align="center">
                <template #default="{ row }">
                  <el-tag v-if="row.author?.channelType" size="small" type="primary">
                    {{ row.author.channelType }}
                  </el-tag>
                  <span v-else>-</span>
                </template>
              </el-table-column>
              
              <el-table-column prop="author.authorLevel" label="播主等级" width="100" align="center">
                <template #default="{ row }">
                  <el-tag 
                    v-if="row.authorLevel || row.author?.authorLevel" 
                    :type="getAuthorLevelType(row.authorLevel || row.author?.authorLevel)" 
                    size="small"
                  >
                    {{ getAuthorLevelText(row.authorLevel || row.author?.authorLevel) }}
                  </el-tag>
                  <span v-else>-</span>
                </template>
              </el-table-column>
              
              <el-table-column prop="author.backgroundColor" label="背景颜色" width="100" align="center">
                <template #default="{ row }">
                  <div v-if="row.backgroundColor || row.author?.backgroundColor" class="color-preview">
                    <div 
                      class="color-block" 
                      :style="{ backgroundColor: row.backgroundColor || row.author?.backgroundColor }"
                      :title="row.backgroundColor || row.author?.backgroundColor"
                    ></div>
                  </div>
                  <span v-else>-</span>
                </template>
              </el-table-column>
              
              <el-table-column prop="remark" label="备注" min-width="150">
                <template #default="{ row }">
                  <div class="remark-cell">
                    <span v-if="row.remark || row.author?.remark" class="remark-text">
                      {{ row.remark || row.author?.remark }}
                    </span>
                    <span v-else class="no-remark">暂无备注</span>
                  </div>
                </template>
              </el-table-column>
              
              <el-table-column prop="createTime" label="收藏时间" width="160" sortable>
                <template #default="{ row }">
                  <span class="time-text">{{ formatDate(row.createTime) }}</span>
                </template>
              </el-table-column>
              
              <el-table-column label="操作" width="280" align="center" fixed="right">
                <template #default="{ row }">
                  <el-button 
                    type="primary" 
                    size="small" 
                    :icon="View"
                    @click="viewAuthorDetail(row.author)"
                  >
                    查看详情
                  </el-button>
                  <el-button 
                    type="warning" 
                    size="small" 
                    :icon="Edit"
                    @click="editAuthorSettings(row)"
                  >
                    编辑设置
                  </el-button>
                  <el-button 
                    type="danger" 
                    size="small" 
                    :icon="Delete"
                    @click="removeFavorite(row)"
                    :loading="removingId === row.id"
                  >
                    取消收藏
                  </el-button>
                </template>
              </el-table-column>
            </el-table>
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
          <el-input :value="currentEditAuthor?.nickname || ''" disabled />
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
          <div class="color-picker-container">
            <el-color-picker 
              v-model="editForm.backgroundColor"
              show-alpha
              :predefine="predefineColors"
            />
            <el-input 
              v-model="editForm.backgroundColor" 
              placeholder="如：#FFB6C1"
              style="width: 200px; margin-left: 12px;"
            />
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
          <div v-if="currentDetailAuthor.userDesc || currentDetailAuthor.userUrl" class="author-details">
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
            </el-descriptions>
          </div>
        </div>
        <el-empty v-else-if="!authorDetailLoading" description="暂无播主信息" />
      </div>
      
      <template #footer>
        <el-button @click="closeAuthorDetailDialog">关闭</el-button>
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

// 更新邮箱对话框
const showUpdateEmailDialog = ref(false)
const updateEmailLoading = ref(false)
const emailForm = ref({ email: '' })

// 播主详情弹出框相关
const showAuthorDetailDialog = ref(false)
const authorDetailLoading = ref(false)
const currentDetailAuthor = ref(null)

const filteredFavoriteList = computed(() => {
  if (!searchKeyword.value) return favoriteList.value
  
  const keyword = searchKeyword.value.toLowerCase()
  return favoriteList.value.filter(item => {
    const author = item.author || {}
    const remark = item.remark || author.remark || ''
    return (author.nickname || '').toLowerCase().includes(keyword) ||
           (author.userDesc || '').toLowerCase().includes(keyword) ||
           (author.channelType || '').toLowerCase().includes(keyword) ||
           remark.toLowerCase().includes(keyword)
  })
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
    const response = await favoriteApi.getFavoriteList(authStore.user.id)
    if (response.success) {
      favoriteList.value = response.data || []
      favoriteCount.value = response.total || favoriteList.value.length
    } else {
      ElMessage.error(response.message || '加载收藏列表失败')
    }
  } catch (error) {
    console.error('加载收藏列表失败:', error)
    ElMessage.error('加载收藏列表失败')
  } finally {
    loading.value = false
  }
}

const removeFavorite = async (item) => {
  try {
    await ElMessageBox.confirm(
      `确认取消收藏播主"${item.author?.nickname || 'N/A'}"？`, 
      '警告', 
      {
        type: 'warning',
        confirmButtonText: '确认取消',
        cancelButtonText: '取消'
      }
    )
    
    removingId.value = item.id
    const response = await favoriteApi.removeFavorite(authStore.user.id, item.authorUserId)
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
  if (author?.userId) {
    showAuthorDetailDialog.value = true
    loadAuthorDetailInfo(author.userId)
  } else {
    ElMessage.warning('播主信息不完整')
  }
}

// 加载播主详情信息
const loadAuthorDetailInfo = async (userId) => {
  authorDetailLoading.value = true
  try {
    const response = await authorApi.getAuthorInfo(userId)
    if (response.code === 200) {
      currentDetailAuthor.value = response.data
    } else {
      ElMessage.error('获取播主信息失败')
      currentDetailAuthor.value = null
    }
  } catch (error) {
    console.error('获取播主信息失败:', error)
    ElMessage.error('获取播主信息失败')
    currentDetailAuthor.value = null
  } finally {
    authorDetailLoading.value = false
  }
}

// 关闭播主详情对话框
const closeAuthorDetailDialog = () => {
  showAuthorDetailDialog.value = false
  currentDetailAuthor.value = null
}

// 格式化播主数字（粉丝数、获赞数等）
const formatAuthorNumber = (num) => {
  if (!num) return '0'
  if (num >= 10000) {
    return (num / 10000).toFixed(1) + 'w'
  }
  return num.toString()
}

const handleSearch = () => {
  // 实时搜索过滤
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

onMounted(() => {
  loadFavoriteList()
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
  transition: color 0.3s ease;
}

.nickname-link:hover {
  color: #66b1ff;
}

.author-level {
  display: inline-block;
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  color: white;
  padding: 1px 6px;
  border-radius: 8px;
  font-size: 11px;
  font-weight: 600;
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

/* 新增列样式 */
.color-preview {
  display: flex;
  justify-content: center;
  align-items: center;
}

.color-block {
  width: 24px;
  height: 24px;
  border-radius: 6px;
  border: 1px solid #e5e7eb;
  cursor: help;
  box-shadow: 0 1px 2px rgba(0, 0, 0, 0.1);
}

.remark-cell {
  max-width: 200px;
}

.remark-text {
  color: #374151;
  font-size: 13px;
  line-height: 1.4;
  display: -webkit-box;
  -webkit-line-clamp: 2;
  -webkit-box-orient: vertical;
  overflow: hidden;
}

.no-remark {
  color: #9ca3af;
  font-size: 13px;
  font-style: italic;
}
</style>