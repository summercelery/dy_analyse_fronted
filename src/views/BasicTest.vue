<template>
  <div style="padding: 20px; background: white; min-height: 100vh;">
    <h1 style="color: #333;">基础测试页面</h1>
    <p style="margin: 10px 0;">这是一个最基础的Vue页面测试。</p>
    <p style="margin: 10px 0;">当前时间: {{ currentTime }}</p>
    <p style="margin: 10px 0;">计数器: {{ counter }}</p>
    <button 
      @click="increment" 
      style="padding: 10px 20px; background: #007bff; color: white; border: none; border-radius: 4px; cursor: pointer; margin: 10px 5px;"
    >
      增加计数
    </button>
    <button 
      @click="updateTime" 
      style="padding: 10px 20px; background: #28a745; color: white; border: none; border-radius: 4px; cursor: pointer; margin: 10px 5px;"
    >
      更新时间
    </button>
    
    <div style="border: 1px solid #ccc; padding: 20px; margin-top: 20px; background: #f8f9fa;">
      <h3>认证信息测试</h3>
      <p>用户: {{ authStore.user?.username || '未登录' }}</p>
      <p>Token存在: {{ !!authStore.token }}</p>
      <p>已认证: {{ authStore.isAuthenticated }}</p>
    </div>
  </div>
</template>

<script setup>
import { ref, onMounted } from 'vue'
import { useAuthStore } from '@/store/auth'

const authStore = useAuthStore()
const currentTime = ref(new Date().toLocaleString())
const counter = ref(0)

const increment = () => {
  counter.value++
  console.log('计数器增加到:', counter.value)
}

const updateTime = () => {
  currentTime.value = new Date().toLocaleString()
  console.log('时间更新到:', currentTime.value)
}

onMounted(() => {
  console.log('基础测试页面已挂载')
  console.log('Auth store:', authStore)
})
</script>