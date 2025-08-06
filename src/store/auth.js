import { defineStore } from 'pinia'
import { ref, computed } from 'vue'
import { authApi } from '@/api/auth'
import { ElMessage } from 'element-plus'

export const useAuthStore = defineStore('auth', () => {
  const token = ref(localStorage.getItem('satoken') || '')
  const user = ref(null)

  const isAuthenticated = computed(() => !!token.value && !!user.value)

  const setToken = (newToken) => {
    token.value = newToken
    if (newToken) {
      localStorage.setItem('satoken', newToken)
    } else {
      localStorage.removeItem('satoken')
    }
  }

  const setUser = (userData) => {
    user.value = userData
  }

  const login = async (credentials) => {
    try {
      const response = await authApi.login(credentials)
      if (response.code === 200) {
        setToken(response.data.token)
        setUser(response.data.user)
        ElMessage.success('登录成功')
        return true
      } else {
        ElMessage.error(response.message || '登录失败')
        return false
      }
    } catch (error) {
      ElMessage.error('登录失败，请稍后重试')
      return false
    }
  }

  const register = async (userData) => {
    try {
      const response = await authApi.register(userData)
      if (response.code === 200) {
        ElMessage.success('注册成功，请登录')
        return true
      } else {
        ElMessage.error(response.message || '注册失败')
        return false
      }
    } catch (error) {
      ElMessage.error('注册失败，请稍后重试')
      return false
    }
  }

  const logout = async () => {
    try {
      await authApi.logout()
    } catch (error) {
      console.error('Logout error:', error)
    } finally {
      setToken('')
      setUser(null)
      ElMessage.success('退出成功')
    }
  }

  const checkToken = async () => {
    console.log('checkToken called, token:', token.value)
    if (!token.value) return false
    
    try {
      const response = await authApi.getUserInfo()
      console.log('getUserInfo response:', response)
      if (response.code === 200) {
        setUser(response.data)
        console.log('Token验证成功，用户信息:', response.data)
        return true
      } else {
        console.log('Token验证失败:', response.message)
        setToken('')
        setUser(null)
        return false
      }
    } catch (error) {
      console.error('Token验证出错:', error)
      setToken('')
      setUser(null)
      return false
    }
  }

  return {
    token,
    user,
    isAuthenticated,
    login,
    register,
    logout,
    checkToken,
    setToken,
    setUser
  }
})