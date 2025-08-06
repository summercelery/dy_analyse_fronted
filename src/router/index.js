import { createRouter, createWebHistory } from 'vue-router'
import { useAuthStore } from '@/store/auth'

const routes = [
  {
    path: '/',
    redirect: '/dashboard'
  },
  {
    path: '/login',
    name: 'Login',
    component: () => import('@/views/Login.vue'),
    meta: { requiresGuest: true }
  },
  {
    path: '/dashboard',
    name: 'Dashboard',
    component: () => import('@/views/Dashboard.vue'),
    meta: { requiresAuth: true }
  },
  {
    path: '/dashboard-old',
    name: 'DashboardOld',
    component: () => import('@/views/Dashboard.vue'),
    meta: { requiresAuth: true }
  },
  {
    path: '/monitor',
    name: 'Monitor',
    component: () => import('@/views/Monitor.vue'),
    meta: { requiresAuth: true }
  },
  {
    path: '/music',
    name: 'Music',
    component: () => import('@/views/Music.vue'),
    meta: { requiresAuth: true }
  },
  {
    path: '/monitor-old',
    name: 'MonitorOld',
    component: () => import('@/views/Monitor.vue'),
    meta: { requiresAuth: true }
  },
  {
    path: '/stats/:awemeId',
    name: 'Stats',
    component: () => import('@/views/Stats.vue'),
    meta: { requiresAuth: true }
  },
  {
    path: '/test',
    name: 'Test',
    component: () => import('@/views/TestDashboard.vue'),
    meta: { requiresAuth: true }
  },
  {
    path: '/basic',
    name: 'Basic',
    component: () => import('@/views/BasicTest.vue'),
    meta: { requiresAuth: true }
  },
  {
    path: '/standalone',
    name: 'Standalone',
    component: () => import('@/views/StandaloneDashboard.vue'),
    meta: { requiresAuth: true }
  }
]

const router = createRouter({
  history: createWebHistory(),
  routes
})

// 路由守卫
router.beforeEach(async (to, from, next) => {
  const authStore = useAuthStore()
  
  console.log('路由守卫:', {
    to: to.path,
    token: !!authStore.token,
    user: !!authStore.user,
    isAuthenticated: authStore.isAuthenticated,
    requiresAuth: to.meta.requiresAuth
  })
  
  // 如果有token但没有用户信息，先尝试验证token
  if (authStore.token && !authStore.user) {
    console.log('检查token有效性...')
    await authStore.checkToken()
    console.log('token检查完成，isAuthenticated:', authStore.isAuthenticated)
  }
  
  if (to.meta.requiresAuth && !authStore.isAuthenticated) {
    console.log('需要认证但未登录，跳转到登录页')
    next('/login')
  } else if (to.meta.requiresGuest && authStore.isAuthenticated) {
    console.log('已登录用户访问登录页，跳转到dashboard')
    next('/dashboard')
  } else {
    console.log('路由守卫通过')
    next()
  }
})

export default router