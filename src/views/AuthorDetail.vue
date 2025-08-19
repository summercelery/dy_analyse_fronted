<template>
  <div class="author-layout">
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
        <el-button @click="goBack" :icon="ArrowLeft" style="margin-left: 16px;">返回</el-button>
      </div>
    </header>

    <main class="content">
      <div class="page-header">
        <h2 class="page-title">播主信息</h2>
      </div>

      <el-card v-loading="loading">
        <div v-if="author" class="author-info">
          <div class="row">
            <div><strong>用户ID：</strong>{{ author.userId }}</div>
            <div><strong>昵称：</strong>{{ author.nickname }}</div>
          </div>
          <div class="row">
            <div><strong>粉丝：</strong>{{ formatNumber(author.followerCount) }}</div>
            <div><strong>获赞：</strong>{{ formatNumber(author.totalFavorited) }}</div>
          </div>
          <div class="row">
            <div><strong>性别：</strong>{{ author.gender || '-' }}</div>
            <div><strong>地区：</strong>{{ author.ipLocation || '-' }}</div>
          </div>
          <div class="row" v-if="author.userUrl">
            <div><strong>播主地址：</strong>
              <el-link 
                type="primary" 
                :href="author.userUrl" 
                target="_blank"
                class="author-link"
              >
                {{ author.userUrl }}
              </el-link>
            </div>
          </div>
        </div>
        <el-empty v-else description="暂无播主信息" />
      </el-card>
    </main>

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
import { ref, onMounted } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { useAuthStore } from '@/store/auth'
import { authorApi } from '@/api/author'
import { authApi } from '@/api/auth'
import { ElMessage, ElMessageBox } from 'element-plus'
import { ArrowLeft, ArrowDown } from '@element-plus/icons-vue'

const route = useRoute()
const router = useRouter()
const authStore = useAuthStore()
const loading = ref(false)
const author = ref(null)

// 更新邮箱对话框
const showUpdateEmailDialog = ref(false)
const updateEmailLoading = ref(false)
const emailForm = ref({ email: '' })

const goBack = () => router.back()

const formatNumber = (num) => {
  if (!num) return '0'
  if (num >= 10000) return (num / 10000).toFixed(1) + 'w'
  return num.toString()
}

const loadAuthor = async () => {
  const userId = route.params.userId
  if (!userId) return
  loading.value = true
  try {
    const res = await authorApi.getAuthorInfo(userId)
    if (res.code === 200) {
      author.value = res.data
    }
  } finally {
    loading.value = false
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

onMounted(loadAuthor)
</script>

<style scoped>
.author-layout { min-height: 100vh; background: #f5f7fa; }
.header { height: 64px; background: #fff; display: flex; align-items: center; justify-content: space-between; padding: 0 24px; border-bottom: 1px solid #e6e8eb; box-shadow: 0 1px 4px rgba(0, 21, 41, 0.08); }
.system-title { margin: 0; font-size: 20px; font-weight: 600; color: #1f2937; }
.header-right { display: flex; align-items: center; }
.user-info { display: flex; align-items: center; gap: 12px; }
.username { font-weight: 500; color: #374151; }
.dropdown-icon { color: #6b7280; cursor: pointer; }
.content { padding: 24px; }
.page-header { margin-bottom: 16px; }
.page-title { margin: 0; font-size: 22px; font-weight: 600; }
.author-info { display: flex; flex-direction: column; gap: 12px; }
.row { display: flex; gap: 32px; color: #374151; }
.author-link { word-break: break-all; }
</style>


