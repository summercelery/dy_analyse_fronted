<template>
  <div class="author-layout">
    <header class="header">
      <div class="header-left">
        <h1 class="system-title">抖音短视频分析系统</h1>
      </div>
      <div class="header-right">
        <el-button @click="goBack" :icon="ArrowLeft">返回</el-button>
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
  </div>
</template>

<script setup>
import { ref, onMounted } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { authorApi } from '@/api/author'
import { ArrowLeft } from '@element-plus/icons-vue'

const route = useRoute()
const router = useRouter()
const loading = ref(false)
const author = ref(null)

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

onMounted(loadAuthor)
</script>

<style scoped>
.author-layout { min-height: 100vh; background: #f5f7fa; }
.header { height: 64px; background: #fff; display: flex; align-items: center; justify-content: space-between; padding: 0 24px; border-bottom: 1px solid #e6e8eb; }
.system-title { margin: 0; font-size: 20px; font-weight: 600; color: #1f2937; }
.content { padding: 24px; }
.page-header { margin-bottom: 16px; }
.page-title { margin: 0; font-size: 22px; font-weight: 600; }
.author-info { display: flex; flex-direction: column; gap: 12px; }
.row { display: flex; gap: 32px; color: #374151; }
.author-link { word-break: break-all; }
</style>


