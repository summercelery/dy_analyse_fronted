<template>
  <div class="music-layout">
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
          <h2 class="page-title">音乐管理</h2>
          <p class="page-desc">管理系统中的音乐库，支持音乐的增删改查操作</p>
        </div>

        <!-- 操作栏 -->
        <div class="toolbar">
          <div class="toolbar-left">
            <el-button type="primary" @click="showAddDialog = true" :icon="Plus">
              添加音乐
            </el-button>
          </div>
          <div class="toolbar-right">
            <el-input
              v-model="searchKeyword"
              placeholder="搜索音乐标题、作者或专辑"
              :prefix-icon="Search"
              style="width: 300px;"
              clearable
              @input="handleSearch"
            />
            <el-button 
              type="primary" 
              :icon="Search" 
              @click="searchMusic"
              :loading="loading"
            >
              搜索
            </el-button>
          </div>
        </div>

        <!-- 音乐列表 -->
        <el-card class="music-table-card">
          <template #header>
            <div class="card-header">
              <span class="card-title">音乐列表</span>
            </div>
          </template>
          
          <div v-loading="loading">
            <el-table 
              :data="filteredMusicList" 
              style="width: 100%"
              :empty-text="filteredMusicList.length === 0 ? '暂无音乐数据' : ''"
            >
              <el-table-column label="ID" width="80">
                <template #default="{ row }">
                  <span class="music-id">{{ row.music?.id || row.id }}</span>
                </template>
              </el-table-column>
              
              <el-table-column label="音乐标题" min-width="150">
                <template #default="{ row }">
                  <div class="music-title">
                    {{ row.music?.title || row.title || 'N/A' }}
                  </div>
                </template>
              </el-table-column>
              
              <el-table-column label="作者" min-width="120">
                <template #default="{ row }">
                  <div class="music-author">
                    {{ row.music?.author || row.author || 'N/A' }}
                  </div>
                </template>
              </el-table-column>
              
              <el-table-column label="专辑" min-width="120">
                <template #default="{ row }">
                  <div class="music-album">
                    {{ row.music?.album || row.album || 'N/A' }}
                  </div>
                </template>
              </el-table-column>
              
              <el-table-column label="标签" min-width="200">
                <template #default="{ row }">
                  <div class="music-tags">
                    <el-tag
                      v-for="tag in parseTags(row.music?.tagList || row.tagList)"
                      :key="tag"
                      size="small"
                      style="margin-right: 5px;"
                    >
                      {{ tag }}
                    </el-tag>
                    <span v-if="!parseTags(row.music?.tagList || row.tagList).length" class="na-text">N/A</span>
                  </div>
                </template>
              </el-table-column>
              
              <el-table-column label="24H热度" width="100">
                <template #default="{ row }">
                  <div class="hotness-info">
                    <span class="hotness-value">{{ formatHotness(row.normalizedHotness) }}</span>
                  </div>
                </template>
              </el-table-column>
              
              
              <el-table-column label="创建时间" width="180">
                <template #default="{ row }">
                  {{ formatDate(row.music?.createTime || row.createTime) }}
                </template>
              </el-table-column>
              
              <el-table-column label="操作" width="240" fixed="right">
                <template #default="{ row }">
                  <div class="table-actions">
                    <el-tooltip content="查看详情" placement="top">
                      <el-button 
                        type="primary" 
                        size="small" 
                        :icon="View"
                        @click="viewMusicDetail(row)"
                        link
                      />
                    </el-tooltip>
                    
                    <el-tooltip content="热度变化" placement="top">
                      <el-button 
                        type="success" 
                        size="small" 
                        :icon="DataAnalysis"
                        @click="viewHotnessChart(row)"
                        link
                      />
                    </el-tooltip>
                    
                    <el-tooltip content="编辑音乐" placement="top">
                      <el-button 
                        type="primary" 
                        size="small" 
                        :icon="Edit"
                        @click="editMusic(row)"
                        link
                      />
                    </el-tooltip>
                    
                    <el-tooltip content="删除音乐" placement="top">
                      <el-button 
                        type="danger" 
                        size="small" 
                        :icon="Delete"
                        @click="deleteMusic(row)"
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

    <!-- 添加/编辑音乐对话框 -->
    <el-dialog
      v-model="showAddDialog"
      :title="editingMusic ? '编辑音乐' : '添加音乐'"
      width="500px"
      @close="resetForm"
    >
      <el-form :model="musicForm" :rules="formRules" ref="formRef" label-width="100px">
        <el-form-item label="音乐标题" prop="title">
          <el-input 
            v-model="musicForm.title" 
            placeholder="请输入音乐标题"
          />
        </el-form-item>
        
        <el-form-item label="作者" prop="author">
          <el-input 
            v-model="musicForm.author" 
            placeholder="请输入作者名称"
          />
        </el-form-item>
        
        <el-form-item label="专辑" prop="album">
          <el-input 
            v-model="musicForm.album" 
            placeholder="请输入专辑名称"
          />
        </el-form-item>
        
        <el-form-item label="搜索标签" prop="tags">
          <div class="tag-input-container">
            <el-input 
              v-model="newTag"
              placeholder="输入标签后按回车添加"
              @keyup.enter="addTag"
              class="tag-input"
            >
              <template #append>
                <el-button @click="addTag" :disabled="!newTag.trim()">添加</el-button>
              </template>
            </el-input>
            
                       <div class="tag-list" v-if="musicForm.tags.length > 0">
             <el-tag
               v-for="(tag, index) in musicForm.tags"
               :key="index"
               closable
               @close="removeTag(index)"
               class="music-tag"
             >
               {{ tag }}
             </el-tag>

           </div>
            
                       <div class="tag-tips">
             <small>提示：此标签用于抖音搜索,将自动监控标签下top25短视频</small>
           </div>
          </div>
        </el-form-item>
      </el-form>
      
      <template #footer>
        <el-button @click="showAddDialog = false">取消</el-button>
        <el-button type="primary" @click="handleSubmit" :loading="submitLoading">
          {{ editingMusic ? '更新' : '添加' }}
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

    <!-- 热度变化图表对话框 -->
    <el-dialog
      v-model="showHotnessChartDialog"
      :title="`${currentMusicTitle} - 热度变化趋势`"
      width="900px"
      @close="resetHotnessChart"
    >
      <div class="hotness-chart-container">
        <div class="chart-header">
          <div class="chart-controls">
            <el-radio-group v-model="chartDays" @change="loadHotnessChart">
              <el-radio-button :value="7">最近7天</el-radio-button>
              <el-radio-button :value="15">最近15天</el-radio-button>
              <el-radio-button :value="30">最近30天</el-radio-button>
            </el-radio-group>
          </div>
          <div class="chart-info" v-if="chartData && chartData.timestamps && chartData.timestamps.length > 0">
            <span class="info-item">数据点: {{ chartData.dataCount || chartData.timestamps.length }}</span>
            <span class="info-item">更新时间: {{ formatChartTime(chartData.endTime || chartData.lastUpdate) }}</span>
          </div>
        </div>
        
        <div v-loading="chartLoading" class="chart-content">
          <div v-if="!chartLoading && chartData && chartData.timestamps && chartData.timestamps.length > 0" ref="chartContainer" class="chart"></div>
          <div v-else-if="!chartLoading" class="chart-empty">
            <el-empty description="暂无热度数据">
              <template #description>
                <span>该音乐暂无热度统计数据</span>
                <br>
                <small>请确认音乐已开始监控且有足够的数据积累</small>
              </template>
            </el-empty>
          </div>
        </div>
      </div>
      
      <template #footer>
        <el-button @click="showHotnessChartDialog = false">关闭</el-button>
      </template>
    </el-dialog>

  </div>
</template>

<script setup>
import { ref, computed, onMounted, nextTick } from 'vue'
import { useRouter } from 'vue-router'
import { useAuthStore } from '@/store/auth'
import { musicApi } from '@/api/music'
import { authApi } from '@/api/auth'
import { ElMessage, ElMessageBox } from 'element-plus'
import { parseTags, stringifyTags, validateTags, isTagDuplicate, isValidTag } from '@/utils/tagUtils'
import * as echarts from 'echarts'
import {
  Plus,
  Refresh,
  Search,
  Edit,
  Delete,
  Headset,
  Odometer,
  View,
  ArrowDown,
  DataAnalysis,
  Star
} from '@element-plus/icons-vue'

const router = useRouter()
const authStore = useAuthStore()

const loading = ref(false)
const submitLoading = ref(false)
const musicList = ref([])
const searchKeyword = ref('')
const showAddDialog = ref(false)
const editingMusic = ref(null)

// 热度图表相关
const showHotnessChartDialog = ref(false)
const chartLoading = ref(false)
const chartData = ref(null)
const chartDays = ref(7)
const currentMusicId = ref(null)
const currentMusicTitle = ref('')
const chartContainer = ref(null)
let chartInstance = null

const formRef = ref()
const musicForm = ref({
  id: null,
  title: '',
  author: '',
  album: '',
  tags: [] // 改为数组格式
})

const newTag = ref('') // 新增标签输入

// 更新邮箱对话框
const showUpdateEmailDialog = ref(false)
const updateEmailLoading = ref(false)
const emailForm = ref({ email: '' })


const formRules = {
  title: [
    { required: true, message: '请输入音乐标题', trigger: 'blur' }
  ],
  author: [
    { required: true, message: '请输入作者名称', trigger: 'blur' }
  ],
  album: [
    { required: true, message: '请输入专辑名称', trigger: 'blur' }
  ],
  tags: [
    { 
      validator: (rule, value, callback) => {
        if (value.length > 10) {
          callback(new Error('标签数量不能超过10个'))
        } else if (value.some(tag => tag.length > 20)) {
          callback(new Error('单个标签长度不能超过20个字符'))
        } else {
          callback()
        }
      },
      trigger: 'change'
    }
  ]
}

const filteredMusicList = computed(() => {
  if (!searchKeyword.value) return musicList.value
  
  const keyword = searchKeyword.value.toLowerCase()
  return musicList.value.filter(item => {
    const music = item.music || item
    const tags = parseTags(music.tagList)
    return (music.title || '').toLowerCase().includes(keyword) ||
           (music.author || '').toLowerCase().includes(keyword) ||
           (music.album || '').toLowerCase().includes(keyword) ||
           tags.some(tag => tag.toLowerCase().includes(keyword))
  })
})

const formatDate = (dateStr) => {
  if (!dateStr) return 'N/A'
  return new Date(dateStr).toLocaleString('zh-CN')
}

const formatHotness = (hotness) => {
  if (hotness == null) return 'N/A'
  return parseFloat(hotness).toFixed(1)
}

const loadMusicList = async () => {
  loading.value = true
  try {
    const response = await musicApi.getMusicList()
    if (response.code === 200) {
      musicList.value = response.data || []
    } else {
      ElMessage.error(response.message || '加载音乐列表失败')
    }
  } catch (error) {
    console.error('加载音乐列表失败:', error)
    ElMessage.error('加载音乐列表失败')
  } finally {
    loading.value = false
  }
}

const handleSearch = () => {
  // 输入框变化时的处理，可以在这里添加防抖逻辑
  // 当前使用实时过滤，不需要额外处理
}

const searchMusic = async () => {
  if (!searchKeyword.value.trim()) {
    await loadMusicList()
    return
  }
  
  loading.value = true
  try {
    // 使用扩展搜索接口，支持标签搜索
    const response = await musicApi.searchMusicExtended(searchKeyword.value.trim())
    if (response.code === 200) {
      musicList.value = response.data || []
    } else {
      ElMessage.error(response.message || '搜索失败')
    }
  } catch (error) {
    console.error('搜索失败:', error)
    ElMessage.error('搜索失败')
  } finally {
    loading.value = false
  }
}

const resetForm = () => {
  editingMusic.value = null
  musicForm.value = {
    id: null,
    title: '',
    author: '',
    album: '',
    tags: []
  }
  newTag.value = '' // 重置新增标签输入
  if (formRef.value) {
    formRef.value.resetFields()
  }
}

const editMusic = (musicData) => {
  const music = musicData.music || musicData
  editingMusic.value = musicData
  musicForm.value = {
    id: music.id,
    title: music.title || '',
    author: music.author || '',
    album: music.album || '',
    tags: parseTags(music.tagList) // 使用统一的标签解析函数
  }
  showAddDialog.value = true
}

const handleSubmit = async () => {
  if (!formRef.value) return
  
  try {
    await formRef.value.validate()
  } catch (error) {
    return
  }
  
  // 标签验证
  const tagValidation = validateTags(musicForm.value.tags)
  if (!tagValidation.valid) {
    ElMessage.warning(tagValidation.message)
    return
  }
  
  submitLoading.value = true
  try {
    // 准备提交数据，将标签数组转换为API需要的JSON字符串格式
    const submitData = {
      ...musicForm.value,
      tagList: stringifyTags(musicForm.value.tags) // 使用工具函数转换为JSON数组字符串格式
    }
    
    let response
    if (editingMusic.value) {
      response = await musicApi.updateMusic(submitData)
    } else {
      response = await musicApi.addMusic(submitData)
    }
    
    if (response.code === 200) {
      ElMessage.success(editingMusic.value ? '更新音乐成功' : '添加音乐成功')
      showAddDialog.value = false
      resetForm()
      await loadMusicList()
    } else {
      ElMessage.error(response.message || '操作失败')
    }
  } catch (error) {
    console.error('操作失败:', error)
    ElMessage.error('操作失败')
  } finally {
    submitLoading.value = false
  }
}

const deleteMusic = async (musicData) => {
  const music = musicData.music || musicData
  try {
    await ElMessageBox.confirm(`确认删除音乐"${music.title}"？删除后无法恢复`, '警告', {
      type: 'warning',
      confirmButtonText: '确认删除',
      cancelButtonText: '取消'
    })
    
    const response = await musicApi.deleteMusic(music.id)
    if (response.code === 200) {
      ElMessage.success('删除成功')
      await loadMusicList()
    } else {
      // 根据API文档的错误信息进行处理
      if (response.message?.includes('歌曲信息不存在')) {
        ElMessage.error('该音乐不存在或已被删除')
        await loadMusicList() // 刷新列表以同步状态
      } else {
        ElMessage.error(response.message || '删除失败')
      }
    }
  } catch (error) {
    if (error !== 'cancel') {
      console.error('删除失败:', error)
      ElMessage.error('删除失败')
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

const handleRowClick = (row) => {
  viewMusicDetail(row)
}

const viewMusicDetail = (musicData) => {
  const music = musicData.music || musicData
  router.push({ path: '/monitor', query: { musicId: music.id } })
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

const addTag = () => {
  const tag = newTag.value.trim()
  
  // 验证标签是否为空
  if (!tag) {
    ElMessage.warning('请输入标签内容')
    return
  }
  
  // 验证标签是否有效
  if (!isValidTag(tag)) {
    ElMessage.warning('标签长度应在1-20个字符之间')
    return
  }
  
  // 验证标签数量
  if (musicForm.value.tags.length >= 10) {
    ElMessage.warning('标签数量不能超过10个')
    return
  }
  
  // 验证标签是否重复
  if (isTagDuplicate(musicForm.value.tags, tag)) {
    ElMessage.warning('标签已存在')
    return
  }
  
  // 添加标签
  musicForm.value.tags.push(tag)
  newTag.value = ''
  ElMessage.success('标签添加成功')
}

const removeTag = (index) => {
  musicForm.value.tags.splice(index, 1)
}

// 热度图表相关函数
const viewHotnessChart = async (musicData) => {
  const music = musicData.music || musicData
  currentMusicId.value = music.id
  currentMusicTitle.value = music.title || 'N/A'
  chartDays.value = 7
  showHotnessChartDialog.value = true
  
  // 等待对话框完全打开后再加载数据
  await nextTick()
  setTimeout(() => {
    loadHotnessChart()
  }, 200)
}

const loadHotnessChart = async () => {
  if (!currentMusicId.value) return
  
  chartLoading.value = true
  try {
    const response = await musicApi.getMusicHotnessChart(currentMusicId.value, chartDays.value)
    console.log('API response:', response)
    
    if (response.code === 200) {
      const data = response.data
      
      // 验证返回的数据结构
      if (!data) {
        console.warn('API returned null/undefined data')
        ElMessage.warning('暂无热度数据')
        chartData.value = null
        return
      }
      
      // 检查必要的数据字段
      if (!data.timestamps || !Array.isArray(data.timestamps) || data.timestamps.length === 0) {
        console.warn('Invalid timestamps data:', data.timestamps)
        ElMessage.warning('热度数据格式不正确')
        chartData.value = null
        return
      }
      
      console.log('Chart data received:', data)
      chartData.value = data
      await nextTick()
      
      // 延迟渲染确保DOM已经更新
      setTimeout(() => {
        renderChart()
      }, 100)
    } else {
      console.error('API error:', response)
      ElMessage.error(response.message || '获取热度数据失败')
      chartData.value = null
    }
  } catch (error) {
    console.error('获取热度数据失败:', error)
    ElMessage.error('获取热度数据失败')
    chartData.value = null
  } finally {
    chartLoading.value = false
  }
}

const renderChart = () => {
  console.log('renderChart called, chartContainer:', chartContainer.value, 'chartData:', chartData.value)
  
  if (!chartContainer.value || !chartData.value) {
    console.warn('Chart container or data not available')
    return
  }
  
  // 检查容器尺寸
  const containerRect = chartContainer.value.getBoundingClientRect()
  console.log('Container size:', containerRect.width, 'x', containerRect.height)
  
  if (containerRect.width === 0 || containerRect.height === 0) {
    console.warn('Chart container has zero size, retrying...')
    setTimeout(() => renderChart(), 100)
    return
  }
  
  // 检查数据完整性
  const data = chartData.value
  if (!data.timestamps || !Array.isArray(data.timestamps) || data.timestamps.length === 0) {
    console.warn('Chart data timestamps is empty or invalid:', data)
    return
  }
  
  if (chartInstance) {
    chartInstance.dispose()
    chartInstance = null
  }
  
  try {
    chartInstance = echarts.init(chartContainer.value)
    console.log('Chart instance created:', chartInstance)
  } catch (error) {
    console.error('Failed to initialize chart:', error)
    return
  }
  
  // 安全地处理数据，确保数组存在且有数据
  const normalizedData = (data.normalizedHotness || []).map(v => {
    const num = parseFloat(v)
    return isNaN(num) ? 0 : num
  })
  
  // 处理时间戳，转换为Date对象以支持时间轴
  const timeData = data.timestamps.map(timestamp => {
    // 假设时间格式是 "08-18 15:26"，需要转换为完整的日期时间
    const currentYear = new Date().getFullYear()
    const [monthDay, time] = timestamp.split(' ')
    const [month, day] = monthDay.split('-')
    const [hour, minute] = time.split(':')
    return new Date(currentYear, parseInt(month) - 1, parseInt(day), parseInt(hour), parseInt(minute))
  })
  
  console.log('Chart data:', {
    timestamps: data.timestamps,
    timeData,
    normalizedData
  })
  
  const option = {
    title: {
      text: '热度变化趋势',
      left: 'center',
      textStyle: {
        fontSize: 16,
        fontWeight: 'bold'
      }
    },
    tooltip: {
      trigger: 'axis',
      axisPointer: {
        type: 'cross',
        label: {
          backgroundColor: '#6a7985'
        }
      },
      formatter: function(params) {
        if (!params || params.length === 0) return ''
        const param = params[0]
        const time = new Date(param.value[0])
        const value = parseFloat(param.value[1] || 0).toFixed(2)
        const timeStr = `${String(time.getMonth() + 1).padStart(2, '0')}-${String(time.getDate()).padStart(2, '0')} ${String(time.getHours()).padStart(2, '0')}:${String(time.getMinutes()).padStart(2, '0')}`
        return `时间: ${timeStr}<br/>${param.seriesName}: ${value}`
      }
    },
    legend: {
      data: ['归一化热度'],
      top: 30
    },
    grid: {
      left: '3%',
      right: '4%',
      bottom: '3%',
      top: '15%',
      containLabel: true
    },
    xAxis: {
      type: 'time',
      boundaryGap: false,
      axisLabel: {
        formatter: function (value) {
          const date = new Date(value)
          return `${String(date.getMonth() + 1).padStart(2, '0')}-${String(date.getDate()).padStart(2, '0')} ${String(date.getHours()).padStart(2, '0')}:${String(date.getMinutes()).padStart(2, '0')}`
        },
        rotate: 45,
        fontSize: 10
      }
    },
    yAxis: {
      type: 'value',
      name: '归一化热度',
      axisLabel: {
        formatter: '{value}'
      }
    },
    series: [
      {
        name: '归一化热度',
        type: 'line',
        data: timeData.map((time, index) => [time, normalizedData[index]]),
        smooth: true,
        lineStyle: {
          color: '#f56565',
          width: 3
        },
        itemStyle: {
          color: '#f56565'
        },
        areaStyle: {
          color: {
            type: 'linear',
            x: 0,
            y: 0,
            x2: 0,
            y2: 1,
            colorStops: [{
              offset: 0, color: 'rgba(245, 101, 101, 0.3)'
            }, {
              offset: 1, color: 'rgba(245, 101, 101, 0.1)'
            }]
          }
        }
      }
    ]
  }
  
  try {
    chartInstance.setOption(option)
    console.log('Chart option set successfully')
    
    // 强制重绘
    chartInstance.resize()
    console.log('Chart resized')
  } catch (error) {
    console.error('Failed to set chart option:', error)
    return
  }
  
  // 响应式调整
  window.addEventListener('resize', () => {
    if (chartInstance) {
      chartInstance.resize()
    }
  })
}

const resetHotnessChart = () => {
  if (chartInstance) {
    chartInstance.dispose()
    chartInstance = null
  }
  chartData.value = null
  currentMusicId.value = null
  currentMusicTitle.value = ''
}

const formatChartTime = (timeStr) => {
  if (!timeStr) return 'N/A'
  return new Date(timeStr).toLocaleString('zh-CN')
}






onMounted(() => {
  loadMusicList()
})
</script>

<style scoped>
.music-layout {
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

.stats-row {
  display: flex;
  gap: 20px;
  margin-bottom: 24px;
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
}

.stat-card:hover {
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.1);
  transform: translateY(-2px);
}

.stat-card.total .stat-icon {
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
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

.music-table-card {
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

.music-id {
  font-family: 'Consolas', 'Monaco', monospace;
  font-weight: 600;
  color: #374151;
}

.music-title {
  font-weight: 600;
  color: #1f2937;
}

.music-author, .music-album {
  color: #374151;
}

.music-tags {
  display: flex;
  flex-wrap: wrap;
  gap: 4px;
}

.na-text {
  color: #9ca3af;
  font-style: italic;
}

.table-actions {
  display: flex;
  gap: 8px;
}

/* 标签输入容器样式 */
.tag-input-container {
  width: 100%;
}

.tag-input {
  margin-bottom: 10px;
}

.tag-list {
  display: flex;
  flex-wrap: wrap;
  gap: 8px;
  margin-bottom: 8px;
}

.music-tag {
  margin-right: 0;
}

.tag-tips {
  color: #909399;
  font-size: 12px;
  line-height: 1.4;
}

/* 音乐标签样式 */
.music-tags {
  display: flex;
  flex-wrap: wrap;
  gap: 4px;
  margin-top: 4px;
}

.music-tag {
  margin: 0;
  font-size: 12px;
  height: 24px;
  line-height: 22px;
  padding: 0 8px;
}

/* 热度和视频数样式 */
.hotness-info {
  display: flex;
  align-items: center;
  gap: 4px;
}

.hotness-value {
  font-weight: 600;
  color: #f56565;
  font-size: 14px;
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

/* 热度图表对话框样式 */
.hotness-chart-container {
  height: 500px;
  min-height: 500px;
}

.chart-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 20px;
  padding-bottom: 12px;
  border-bottom: 1px solid #e6e8eb;
}

.chart-controls {
  display: flex;
  gap: 12px;
}

.chart-info {
  display: flex;
  gap: 16px;
  font-size: 14px;
  color: #6b7280;
}

.info-item {
  display: flex;
  align-items: center;
  gap: 4px;
}

.chart-content {
  height: calc(100% - 60px);
  position: relative;
}

.chart {
  width: 100%;
  height: 100%;
  min-height: 400px;
}

.chart-empty {
  display: flex;
  align-items: center;
  justify-content: center;
  height: 100%;
}

/* 调整操作列宽度以适应新按钮 */
:deep(.el-table-column--selection) {
  width: 50px !important;
}

</style>
