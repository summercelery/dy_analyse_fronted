<template>
  <div style="padding: 20px; background: #f5f5f5; min-height: 100vh;">
    <div style="margin-bottom: 20px;">
      <h1 style="color: #333; margin-bottom: 10px;">独立监控管理</h1>
      <div style="display: flex; gap: 10px;">
        <button @click="goTo('/dashboard')" style="padding: 8px 16px; background: #409EFF; color: white; border: none; border-radius: 4px; cursor: pointer;">
          数据概览
        </button>
        <button @click="goTo('/test')" style="padding: 8px 16px; background: #28a745; color: white; border: none; border-radius: 4px; cursor: pointer;">
          测试页面
        </button>
        <button @click="goTo('/standalone')" style="padding: 8px 16px; background: #6c757d; color: white; border: none; border-radius: 4px; cursor: pointer;">
          独立Dashboard
        </button>
      </div>
    </div>
    
    <!-- 添加监控视频 -->
    <div style="background: white; border: 1px solid #ddd; border-radius: 4px; padding: 20px; margin-bottom: 20px;">
      <h3 style="margin-top: 0;">添加监控视频</h3>

      <div style="display: flex; gap: 10px; align-items: end;">
        <div>
          <label style="display: block; margin-bottom: 5px; font-weight: bold;">视频链接或ID:</label>
          <input 
            v-model="newVideoUrl" 
            placeholder="请输入抖音视频链接或ID" 
            style="width: 300px; padding: 8px; border: 1px solid #ddd; border-radius: 4px;"
          />
        </div>
        <div>
          <label style="display: block; margin-bottom: 5px; font-weight: bold;">音乐ID:</label>
          <input 
            v-model="musicId" 
            placeholder="请输入音乐ID（可选）" 
            style="width: 150px; padding: 8px; border: 1px solid #ddd; border-radius: 4px;"
          />
        </div>
        <button 
          @click="addVideo" 
          :style="{
            padding: '8px 16px',
            background: addLoading ? '#6c757d' : '#007bff',
            color: 'white',
            border: 'none',
            borderRadius: '4px',
            cursor: addLoading ? 'not-allowed' : 'pointer'
          }"
          :disabled="addLoading"
        >
          {{ addLoading ? '添加中...' : '添加监控' }}
        </button>
      </div>
    </div>
    
    <!-- 监控列表 -->
    <div style="background: white; border: 1px solid #ddd; border-radius: 4px; padding: 20px;">
      <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 15px;">
        <h3 style="margin: 0;">监控列表</h3>
        <button 
          @click="loadMonitorVideos" 
          style="padding: 8px 16px; background: #409EFF; color: white; border: none; border-radius: 4px; cursor: pointer;"
        >
          刷新
        </button>
      </div>
      
      <div v-if="loading" style="text-align: center; padding: 40px;">
        <p>加载中...</p>
      </div>
      
      <div v-else-if="monitorVideos.length === 0" style="text-align: center; padding: 40px; color: #666;">
        <p>暂无监控视频</p>
      </div>
      
      <div v-else>
        <div style="overflow-x: auto;">
          <table style="width: 100%; border-collapse: collapse;">
            <thead>
              <tr style="background: #f8f9fa;">
                <th style="padding: 12px; text-align: left; border: 1px solid #dee2e6;">视频ID</th>
                <th style="padding: 12px; text-align: left; border: 1px solid #dee2e6;">视频链接</th>
                <th style="padding: 12px; text-align: left; border: 1px solid #dee2e6;">状态</th>
                <th style="padding: 12px; text-align: left; border: 1px solid #dee2e6;">创建时间</th>
                <th style="padding: 12px; text-align: left; border: 1px solid #dee2e6;">操作</th>
              </tr>
            </thead>
            <tbody>
              <tr v-for="(item, index) in monitorVideos" :key="index" style="border-bottom: 1px solid #dee2e6;">
                <td style="padding: 12px; border: 1px solid #dee2e6;">{{ item.monitorVideo?.awemeId || 'N/A' }}</td>
                <td style="padding: 12px; border: 1px solid #dee2e6;">
                  <a :href="item.monitorVideo?.videoUrl" target="_blank" style="color: #409EFF; text-decoration: none;">
                    {{ item.monitorVideo?.videoUrl || 'N/A' }}
                  </a>
                </td>
                <td style="padding: 12px; border: 1px solid #dee2e6;">
                  <span :style="{
                    padding: '4px 8px',
                    borderRadius: '4px',
                    fontSize: '12px',
                    backgroundColor: getStatusColor(item.monitorVideo?.status),
                    color: getStatusTextColor(item.monitorVideo?.status)
                  }">
                    {{ getStatusText(item.monitorVideo?.status) }}
                  </span>
                </td>
                <td style="padding: 12px; border: 1px solid #dee2e6;">{{ item.userMonitor?.createTime || 'N/A' }}</td>
                <td style="padding: 12px; border: 1px solid #dee2e6;">
                  <div style="display: flex; gap: 5px;">
                    <button 
                      @click="viewStats(item.monitorVideo?.awemeId)" 
                      style="padding: 4px 8px; background: #409EFF; color: white; border: none; border-radius: 4px; cursor: pointer; font-size: 12px;"
                    >
                      查看统计
                    </button>
                    <button 
                      @click="toggleStatus(item.monitorVideo?.id, item.monitorVideo?.status === 1 ? 0 : 1)"
                      :style="{
                        padding: '4px 8px',
                        background: item.monitorVideo?.status === 1 ? '#ffc107' : '#28a745',
                        color: 'white',
                        border: 'none',
                        borderRadius: '4px',
                        cursor: 'pointer',
                        fontSize: '12px'
                      }"
                    >
                      {{ item.monitorVideo?.status === 1 ? '停用' : '启用' }}
                    </button>
                    <button 
                      @click="deleteVideo(item.monitorVideo?.id)"
                      style="padding: 4px 8px; background: #dc3545; color: white; border: none; border-radius: 4px; cursor: pointer; font-size: 12px;"
                    >
                      删除
                    </button>
                  </div>
                </td>
              </tr>
            </tbody>
          </table>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, onMounted } from 'vue'
import { useRouter } from 'vue-router'
import { monitorApi } from '@/api/monitor'

const router = useRouter()

const loading = ref(false)
const addLoading = ref(false)
const monitorVideos = ref([])
const newVideoUrl = ref('')
const musicId = ref('')

const goTo = (path) => {
  console.log('导航到:', path)
  router.push(path)
}

const loadMonitorVideos = async () => {
  loading.value = true
  try {
    console.log('独立Monitor页面: 开始加载监控列表...')
    const response = await monitorApi.getMonitorList()
    console.log('独立Monitor页面: API响应:', response)
    if (response.code === 200) {
      monitorVideos.value = response.data || []
      console.log('独立Monitor页面: 监控列表数据:', monitorVideos.value)
    } else {
      console.error('独立Monitor页面: 获取监控列表失败:', response.message)
      alert(response.message || '加载监控列表失败')
    }
  } catch (error) {
    console.error('独立Monitor页面: 加载监控列表出错:', error)
    alert('加载监控列表失败')
  } finally {
    loading.value = false
  }
}

const addVideo = async () => {
  if (!newVideoUrl.value.trim()) {
    alert('请输入视频链接或ID')
    return
  }
  
  addLoading.value = true
  try {
    const response = await monitorApi.addMonitor({
      videoUrl: newVideoUrl.value.trim(),
      musicId: musicId.value.trim() || null
    })
    
    if (response.code === 200) {
      alert('添加监控成功')
      newVideoUrl.value = ''
      musicId.value = ''
      await loadMonitorVideos()
    } else {
      alert(response.message || '添加监控失败')
    }
  } catch (error) {
    console.error('添加监控失败:', error)
    alert('添加监控失败')
  } finally {
    addLoading.value = false
  }
}

const toggleStatus = async (id, status) => {
  try {
    const response = await monitorApi.updateStatus(id, { status })
    if (response.code === 200) {
      loadMonitorVideos()
      alert('更新成功')
    } else {
      alert(response.message || '更新失败')
    }
  } catch (error) {
    alert('更新失败')
  }
}

const deleteVideo = async (id) => {
  if (!confirm('确认删除该监控视频？')) return
  
  try {
    const response = await monitorApi.deleteMonitor(id)
    if (response.code === 200) {
      loadMonitorVideos()
      alert('删除成功')
    } else {
      alert(response.message || '删除失败')
    }
  } catch (error) {
    alert('删除失败')
  }
}

const viewStats = (awemeId) => {
  if (awemeId) {
    router.push(`/stats/${awemeId}`)
  } else {
    alert('视频ID无效')
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

// 获取状态背景颜色
const getStatusColor = (status) => {
  switch (status) {
    case 1: return '#d4edda'  // 启用状态，正常监控
    case 0: return '#d1ecf1'  // 停用状态，暂停监控
    case 2: return '#fff3cd'  // 已删除或无权限，视频不可访问
    case 3: return '#f8d7da'  // 其他失败，爬取遇到其他错误
    default: return '#e2e3e5'
  }
}

// 获取状态文字颜色
const getStatusTextColor = (status) => {
  switch (status) {
    case 1: return '#155724'  // 启用状态，正常监控
    case 0: return '#0c5460'  // 停用状态，暂停监控
    case 2: return '#856404'  // 已删除或无权限，视频不可访问
    case 3: return '#721c24'  // 其他失败，爬取遇到其他错误
    default: return '#6c757d'
  }
}

onMounted(() => {
  console.log('独立Monitor页面已挂载')
  loadMonitorVideos()
})
</script>

<style scoped>
* {
  box-sizing: border-box;
}
</style>