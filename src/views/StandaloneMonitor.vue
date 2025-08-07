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
            placeholder="请输入音乐ID（必填）" 
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
                <th style="padding: 12px; text-align: left; border: 1px solid #dee2e6;">播主名称</th>
                <th style="padding: 12px; text-align: left; border: 1px solid #dee2e6;">状态</th>
                <th style="padding: 12px; text-align: left; border: 1px solid #dee2e6;">发布时间</th>
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
                  <div style="display: flex; flex-direction: column; gap: 2px;">
                    <div style="font-weight: 500; color: #374151; font-size: 14px;">
                      {{ item.authorInfo?.nickname || item.videoInfo?.authorId || 'N/A' }}
                    </div>
                    <div v-if="item.authorInfo?.followerCount" style="font-size: 12px; color: #6b7280;">
                      粉丝: {{ formatFollowerCount(item.authorInfo.followerCount) }}
                    </div>
                  </div>
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
                <td style="padding: 12px; border: 1px solid #dee2e6;">{{ formatPublishTime(item.monitorVideo?.videoPublishTime) }}</td>
                <td style="padding: 12px; border: 1px solid #dee2e6;">
                  <div style="display: flex; gap: 5px;">
                    <button 
                      @click="viewStats(item.monitorVideo?.awemeId)" 
                      style="padding: 4px 8px; background: #409EFF; color: white; border: none; border-radius: 4px; cursor: pointer; font-size: 12px;"
                    >
                      查看统计
                    </button>
                    <button 
                      @click="toggleStatus(item.monitorVideo?.id, item.monitorVideo?.status === 0 ? 1 : 0)"
                      :style="{
                        padding: '4px 8px',
                        background: item.monitorVideo?.status === 0 ? '#28a745' : '#ffc107',
                        color: 'white',
                        border: 'none',
                        borderRadius: '4px',
                        cursor: 'pointer',
                        fontSize: '12px'
                      }"
                    >
                      {{ item.monitorVideo?.status === 0 ? '启用' : '停用' }}
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
import { videoApi } from '@/api/video'
import { authorApi } from '@/api/author'

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
      const data = response.data || []
      
      // 为每个监控项目获取视频信息和播主信息
      const enhancedData = await Promise.all(data.map(async item => {
        let videoInfo = null
        let authorInfo = null
        
        // 获取视频信息
        if (item.monitorVideo?.awemeId) {
          try {
            const videoResponse = await videoApi.getVideoInfo(item.monitorVideo.awemeId)
            if (videoResponse.code === 200) {
              videoInfo = videoResponse.data
            }
          } catch (videoError) {
            console.warn('获取视频信息失败:', videoError)
          }
        }
        
        // 如果有视频信息且包含authorId，获取播主信息
        if (videoInfo?.authorId) {
          try {
            const authorResponse = await authorApi.getAuthorInfo(videoInfo.authorId)
            if (authorResponse.code === 200) {
              authorInfo = authorResponse.data
            }
          } catch (authorError) {
            console.warn('获取播主信息失败:', authorError)
          }
        }
        
        return {
          ...item,
          videoInfo,
          authorInfo
        }
      }))
      
      monitorVideos.value = enhancedData
      console.log('独立Monitor页面: 增强后的监控列表数据:', monitorVideos.value)
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
  
  // 根据API文档，音乐ID是必选项
  if (!musicId.value.trim()) {
    alert('请输入音乐ID，音乐为必选项')
    return
  }
  
  addLoading.value = true
  try {
    const response = await monitorApi.addMonitor({
      videoUrl: newVideoUrl.value.trim(),
      musicId: parseInt(musicId.value.trim())
    })
    
    if (response.code === 200) {
      alert('添加监控成功')
      newVideoUrl.value = ''
      musicId.value = ''
      await loadMonitorVideos()
    } else {
      // 根据API文档的具体错误信息进行处理
      if (response.message?.includes('音乐ID不能为空，音乐为必选项')) {
        alert('音乐为必选项，请输入音乐ID')
      } else if (response.message?.includes('指定的音乐不存在，请选择有效的音乐')) {
        alert('所输入的音乐ID不存在，请检查后重新输入')
      } else if (response.message?.includes('视频链接不能为空')) {
        alert('请输入视频链接')
      } else if (response.message?.includes('添加失败，可能是链接格式错误或已存在')) {
        alert('视频链接格式错误或该视频已在监控中')
      } else {
        alert(response.message || '添加监控失败')
      }
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

// 格式化发布时间
const formatPublishTime = (timestamp) => {
  if (!timestamp) return 'N/A'
  // videoPublishTime是秒级时间戳，需要转换为毫秒
  const date = new Date(timestamp * 1000)
  return date.toLocaleString('zh-CN')
}

// 格式化粉丝数
const formatFollowerCount = (count) => {
  if (!count) return '0'
  if (count >= 10000) {
    return (count / 10000).toFixed(1) + 'w'
  }
  return count.toString()
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