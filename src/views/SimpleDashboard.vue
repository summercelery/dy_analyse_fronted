<template>
  <div style="height: 100vh; display: flex; flex-direction: column;">
    <!-- 头部 -->
    <div style="height: 60px; background-color: #409EFF; color: white; display: flex; align-items: center; justify-content: space-between; padding: 0 20px;">
      <div>
        <h2 style="margin: 0;">抖音短视频分析系统</h2>
      </div>
      <div>
        <span style="margin-right: 10px;">欢迎，{{ authStore.user?.username }}</span>
        <button @click="handleLogout" style="padding: 5px 10px; background: rgba(255,255,255,0.2); color: white; border: 1px solid rgba(255,255,255,0.3); border-radius: 4px; cursor: pointer;">
          退出
        </button>
      </div>
    </div>

    <div style="flex: 1; display: flex;">
      <!-- 侧边栏 -->
      <div style="width: 200px; background-color: #545c64; color: white;">
        <div 
          v-for="item in menuItems" 
          :key="item.path"
          @click="navigate(item.path)"
          style="padding: 15px 20px; cursor: pointer; border-bottom: 1px solid #434a54;"
          :style="{ backgroundColor: $route.path === item.path ? '#409EFF' : 'transparent' }"
        >
          {{ item.label }}
        </div>
      </div>

      <!-- 主内容区 -->
      <div style="flex: 1; background-color: #f5f5f5; overflow-y: auto; padding: 20px;">
        <h1 style="color: #333; margin-bottom: 20px;">简化仪表板</h1>
        
        <!-- 调试信息 -->
        <div style="background: white; border: 1px solid #ddd; border-radius: 4px; padding: 20px; margin-bottom: 20px;">
          <h3 style="margin-top: 0;">调试信息</h3>
          <div style="line-height: 1.6;">
            <p><strong>用户信息:</strong> {{ authStore.user?.username || '未登录' }}</p>
            <p><strong>Token:</strong> {{ authStore.token ? '已设置' : '未设置' }}</p>
            <p><strong>认证状态:</strong> {{ authStore.isAuthenticated ? '已认证' : '未认证' }}</p>
            <p><strong>监控数据数量:</strong> {{ monitorVideos.length }}</p>
            <p><strong>加载状态:</strong> {{ loading ? '加载中' : '已完成' }}</p>
          </div>
        </div>
        
        <!-- 数据卡片 -->
        <div style="background: white; border: 1px solid #ddd; border-radius: 4px; padding: 20px; margin-bottom: 20px;">
          <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 15px;">
            <h3 style="margin: 0;">数据概览</h3>
            <button 
              @click="loadData" 
              style="padding: 8px 16px; background: #409EFF; color: white; border: none; border-radius: 4px; cursor: pointer;"
            >
              刷新数据
            </button>
          </div>
          
          <div v-if="loading" style="text-align: center; padding: 40px;">
            <p>加载中...</p>
          </div>
          
          <div v-else-if="monitorVideos.length === 0" style="text-align: center; padding: 40px; color: #666;">
            <p>暂无监控视频数据</p>
            <p style="font-size: 12px; margin-top: 10px;">请前往监控管理页面添加视频</p>
          </div>
          
          <div v-else>
            <div style="display: grid; grid-template-columns: repeat(auto-fit, minmax(200px, 1fr)); gap: 20px; margin-bottom: 20px;">
              <div style="text-align: center; padding: 20px; background: #f8f9fa; border-radius: 4px;">
                <div style="font-size: 24px; font-weight: bold; color: #409EFF; margin-bottom: 8px;">{{ monitorVideos.length }}</div>
                <div style="color: #666; font-size: 14px;">监控视频数</div>
              </div>
              <div style="text-align: center; padding: 20px; background: #f8f9fa; border-radius: 4px;">
                <div style="font-size: 24px; font-weight: bold; color: #409EFF; margin-bottom: 8px;">{{ activeCount }}</div>
                <div style="color: #666; font-size: 14px;">监控中</div>
              </div>
            </div>
            
            <div>
              <h4>最近监控视频</h4>
              <div v-for="(video, index) in monitorVideos.slice(0, 5)" :key="index" 
                   style="padding: 10px; border: 1px solid #eee; margin-bottom: 10px; border-radius: 4px;">
                <p><strong>视频ID:</strong> {{ video.monitorVideo?.awemeId || 'N/A' }}</p>
                <p><strong>状态:</strong> {{ getStatusText(video.monitorVideo?.status) }}</p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, computed, onMounted } from 'vue'
import { useRouter, useRoute } from 'vue-router'
import { useAuthStore } from '@/store/auth'
import { monitorApi } from '@/api/monitor'

const router = useRouter()
const route = useRoute()
const authStore = useAuthStore()

const menuItems = [
  { path: '/dashboard', label: '数据概览' },
  { path: '/monitor', label: '监控管理' },
  { path: '/test', label: '测试页面' },
  { path: '/basic', label: '基础测试' },
  { path: '/standalone', label: '独立Dashboard' }
]

const navigate = (path) => {
  console.log('导航到:', path)
  router.push(path)
}

const handleLogout = async () => {
  if (confirm('确认退出登录？')) {
    await authStore.logout()
    router.push('/login')
  }
}

const loading = ref(false)
const monitorVideos = ref([])

const activeCount = computed(() => {
  // status=1是正常监控中
  return monitorVideos.value.filter(item => item.monitorVideo?.status === 1).length
})

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
    console.log('简化Dashboard: 开始加载数据...')
    const response = await monitorApi.getMonitorList()
    console.log('简化Dashboard: API响应:', response)
    if (response.code === 200) {
      monitorVideos.value = response.data || []
      console.log('简化Dashboard: 监控数据:', monitorVideos.value)
    }
  } catch (error) {
    console.error('简化Dashboard: 加载数据出错:', error)
  } finally {
    loading.value = false
  }
}

onMounted(() => {
  console.log('简化Dashboard组件已挂载')
  loadData()
})
</script>

<style scoped>
/* 基本样式重置 */
* {
  box-sizing: border-box;
}
</style>