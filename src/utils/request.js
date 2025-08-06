import axios from 'axios'
import { ElMessage } from 'element-plus'
import { useAuthStore } from '@/store/auth'

// 创建axios实例
const request = axios.create({
  baseURL: '/api',
  timeout: 10000
})

// 请求拦截器
request.interceptors.request.use(
  config => {
    const token = localStorage.getItem('satoken')
    if (token) {
      // Sa-Token默认从satoken header读取token
      config.headers.satoken = token
      // 同时也设置Authorization header作为备用
      config.headers.Authorization = `Bearer ${token}`
    }
    return config
  },
  error => {
    return Promise.reject(error)
  }
)

// 响应拦截器
request.interceptors.response.use(
  response => {
    return response.data
  },
  error => {
    console.error('API请求错误:', error)
    if (error.response?.status === 401) {
      const authStore = useAuthStore()
      authStore.setToken('')
      authStore.setUser(null)
      ElMessage.error('登录已过期，请重新登录')
      // 跳转到登录页面
      if (window.location.pathname !== '/login') {
        console.log('401错误，跳转到登录页')
        window.location.href = '/login'
      }
    } else {
      ElMessage.error(error.response?.data?.message || '网络错误')
    }
    return Promise.reject(error)
  }
)

export default request