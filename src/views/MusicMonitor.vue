<template>
  <div class="music-monitor-layout">
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
        <div class="page-header">
          <h2 class="page-title">音乐监控</h2>
          <p class="page-desc">选择音乐查看对应的监控视频数据</p>
        </div>

        <!-- 搜索栏 -->
        <div class="search-bar">
          <el-input
            v-model="searchKeyword"
            placeholder="搜索音乐标题、作者或专辑"
            :prefix-icon="Search"
            style="width: 400px;"
            clearable
            size="large"
          />
        </div>

        <!-- 音乐列表 -->
        <div class="music-grid">
          <div 
            v-for="music in filteredMusicList" 
            :key="music.id" 
            class="music-card"
            @click="goToMusicDetail(music.id)"
          >
            <div class="music-header">
              <div class="music-icon">
                <el-icon size="24"><MusicNote /></el-icon>
              </div>
              <div class="music-actions">
                <el-tooltip content="查看监控详情" placement="top">
                  <el-button 
                    type="primary" 
                    size="small" 
                    :icon="View"
                    circle
                    @click.stop="goToMusicDetail(music.id)"
                  />
                </el-tooltip>
              </div>
            </div>
            
            <div class="music-content">
              <h3 class="music-title" :title="music.title">{{ music.title }}</h3>
              <p class="music-author">{{ music.author }}</p>
              <p class="music-album" v-if="music.album">专辑：{{ music.album }}</p>
              
              <div class="music-tags" v-if="music.tagList">
                <el-tag 
                  v-for="tag in music.tagList.split(',')" 
                  :key="tag" 
                  size="small"
                  class="music-tag"
                >
                  {{ tag }}
                </el-tag>
              </div>
            </div>
            
            <div class="music-footer">
              <div class="music-stats">
                <span class="stat-item">
                  <el-icon><VideoCamera /></el-icon>
                  监控视频：{{ music.monitorCount || 0 }}
                </span>
              </div>
              <div class="music-time">
                创建时间：{{ formatDate(music.createTime) }}
              </div>
            </div>
          </div>
        </div>

        <!-- 空状态 -->
        <el-empty 
          v-if="!loading && filteredMusicList.length === 0"
          description="暂无音乐数据"
          :image-size="120"
        />

        <!-- 加载状态 -->
        <div v-if="loading" class="loading-container">
          <el-skeleton :rows="6" animated />
        </div>
      </main>
    </div>
  </div>
</template>

<script setup>
import { ref, computed, onMounted } from 'vue'
import { useRouter } from 'vue-router'
import { useAuthStore } from '@/store/auth'
import { musicApi } from '@/api/music'
import { ElMessage, ElMessageBox } from 'element-plus'

const router = useRouter()
const authStore = useAuthStore()

// 响应式数据
const loading = ref(false)
const musicList = ref([])
const searchKeyword = ref('')

// 计算属性
const filteredMusicList = computed(() => {
  if (!searchKeyword.value) return musicList.value
  
  const keyword = searchKeyword.value.toLowerCase()
  return musicList.value.filter(music => 
    music.title?.toLowerCase().includes(keyword) ||
    music.author?.toLowerCase().includes(keyword) ||
    music.album?.toLowerCase().includes(keyword) ||
    music.tagList?.toLowerCase().includes(keyword)
  )
})



// 方法
const loadMusicList = async () => {
  loading.value = true
  try {
    const response = await musicApi.getMusicList()
    if (response.code === 200) {
      musicList.value = response.data || []
      
      // 为每个音乐获取监控视频数量
      await loadMonitorCounts()
    } else {
      ElMessage.error(response.message || '获取音乐列表失败')
    }
  } catch (error) {
    console.error('获取音乐列表失败:', error)
    ElMessage.error('获取音乐列表失败，请检查网络连接')
  } finally {
    loading.value = false
  }
}

const loadMonitorCounts = async () => {
  // 并行获取每个音乐的监控视频数量
  const promises = musicList.value.map(async (music) => {
    try {
      const response = await musicApi.getMonitorVideosByMusicId(music.id)
      if (response.code === 200) {
        music.monitorCount = response.data?.length || 0
      }
    } catch (error) {
      console.error(`获取音乐 ${music.id} 的监控数量失败:`, error)
      music.monitorCount = 0
    }
  })
  
  await Promise.all(promises)
}

const goToMusicDetail = (musicId) => {
  router.push(`/music-monitor/${musicId}`)
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

const formatDate = (dateString) => {
  if (!dateString) return '-'
  return new Date(dateString).toLocaleDateString('zh-CN')
}

// 生命周期
onMounted(() => {
  loadMusicList()
})
</script>

<style scoped>
.music-monitor-layout {
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

.page-header {
  margin-bottom: 24px;
}

.page-title {
  color: white;
  font-size: 28px;
  font-weight: 700;
  margin: 0 0 8px 0;
}

.page-desc {
  color: rgba(255, 255, 255, 0.8);
  font-size: 16px;
  margin: 0;
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



.music-grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(320px, 1fr));
  gap: 20px;
  margin-bottom: 24px;
}

.music-card {
  background: rgba(255, 255, 255, 0.1);
  backdrop-filter: blur(10px);
  border: 1px solid rgba(255, 255, 255, 0.2);
  border-radius: 12px;
  padding: 20px;
  cursor: pointer;
  transition: all 0.3s ease;
  position: relative;
  overflow: hidden;
}

.music-card:hover {
  transform: translateY(-4px);
  background: rgba(255, 255, 255, 0.15);
  box-shadow: 0 8px 32px rgba(0, 0, 0, 0.1);
}

.music-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 16px;
}

.music-icon {
  width: 40px;
  height: 40px;
  background: linear-gradient(135deg, #667eea, #764ba2);
  border-radius: 8px;
  display: flex;
  align-items: center;
  justify-content: center;
  color: white;
}

.music-title {
  color: white;
  font-size: 18px;
  font-weight: 600;
  margin: 0 0 8px 0;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.music-author {
  color: rgba(255, 255, 255, 0.9);
  font-size: 14px;
  margin: 0 0 4px 0;
}

.music-album {
  color: rgba(255, 255, 255, 0.7);
  font-size: 12px;
  margin: 0 0 12px 0;
}

.music-tags {
  display: flex;
  flex-wrap: wrap;
  gap: 6px;
  margin-bottom: 16px;
}

.music-tag {
  background: rgba(255, 255, 255, 0.2);
  border: none;
  color: white;
}

.music-footer {
  border-top: 1px solid rgba(255, 255, 255, 0.1);
  padding-top: 12px;
  margin-top: 16px;
}

.music-stats {
  display: flex;
  align-items: center;
  margin-bottom: 8px;
}

.stat-item {
  display: flex;
  align-items: center;
  gap: 4px;
  color: rgba(255, 255, 255, 0.8);
  font-size: 12px;
}

.music-time {
  color: rgba(255, 255, 255, 0.6);
  font-size: 12px;
}

.loading-container {
  background: rgba(255, 255, 255, 0.1);
  backdrop-filter: blur(10px);
  border-radius: 12px;
  padding: 24px;
}

:deep(.el-skeleton__item) {
  background: rgba(255, 255, 255, 0.1);
}

:deep(.el-empty__description p) {
  color: rgba(255, 255, 255, 0.8);
}
</style>
