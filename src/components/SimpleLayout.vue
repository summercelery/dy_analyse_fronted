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
      <div style="width: 160px; background-color: #545c64; color: white;">
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
      <div style="flex: 1; background-color: #f5f5f5; overflow-y: auto;">
        <router-view />
      </div>
    </div>
  </div>
</template>

<script setup>
import { useRouter, useRoute } from 'vue-router'
import { useAuthStore } from '@/store/auth'

const router = useRouter()
const route = useRoute()
const authStore = useAuthStore()

const menuItems = [
  { path: '/dashboard', label: '数据概览' },
  { path: '/monitor', label: '监控管理' },
  { path: '/test', label: '测试页面' },
  { path: '/basic', label: '基础测试' }
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
</script>

<style scoped>
.menu-item:hover {
  background-color: #434a54 !important;
}
</style>