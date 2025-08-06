<template>
  <div style="padding: 20px; background: white; min-height: 100vh;">
    <h1>测试页面</h1>
    <div style="border: 1px solid #ccc; padding: 20px; margin: 20px 0;">
      <h2>基本信息测试</h2>
      <p>用户: {{ authStore.user?.username || '未登录' }}</p>
      <p>Token: {{ authStore.token ? '已设置' : '未设置' }}</p>
      <p>认证状态: {{ authStore.isAuthenticated ? '已认证' : '未认证' }}</p>
      <p>监控数据数量: {{ monitorVideos.length }}</p>
      <p>加载状态: {{ loading ? '加载中' : '已完成' }}</p>
    </div>
    
    <div style="border: 1px solid #ccc; padding: 20px; margin: 20px 0;">
      <h2>Element Plus 测试</h2>
      <el-button type="primary" @click="testButton">测试按钮</el-button>
      <el-input v-model="testInput" placeholder="测试输入框" style="width: 200px; margin-left: 10px;"></el-input>
    </div>
    
    <div style="border: 1px solid #ccc; padding: 20px; margin: 20px 0;">
      <h2>API测试</h2>
      <button @click="loadData" style="padding: 10px 20px; background: #409EFF; color: white; border: none; border-radius: 4px;">
        加载数据
      </button>
      <div v-if="apiResponse" style="margin-top: 10px; padding: 10px; background: #f0f0f0;">
        <pre>{{ JSON.stringify(apiResponse, null, 2) }}</pre>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, onMounted } from 'vue'
import { useAuthStore } from '@/store/auth'
import { monitorApi } from '@/api/monitor'
import { ElMessage } from 'element-plus'

const authStore = useAuthStore()
const loading = ref(false)
const monitorVideos = ref([])
const testInput = ref('')
const apiResponse = ref(null)

const testButton = () => {
  ElMessage.success('Element Plus 按钮正常工作！')
}

const loadData = async () => {
  loading.value = true
  try {
    console.log('测试页面: 开始加载数据...')
    const response = await monitorApi.getMonitorList()
    console.log('测试页面: API响应:', response)
    apiResponse.value = response
    if (response.code === 200) {
      monitorVideos.value = response.data || []
    }
  } catch (error) {
    console.error('测试页面: 加载数据出错:', error)
    apiResponse.value = { error: error.message }
  } finally {
    loading.value = false
  }
}

onMounted(() => {
  console.log('测试页面已挂载')
  loadData()
})
</script>