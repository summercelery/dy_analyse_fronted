import request from '@/utils/request'

export const authApi = {
  // 用户登录
  login(data) {
    return request({
      url: '/user/login',
      method: 'post',
      data
    })
  },

  // 用户注册
  register(data) {
    return request({
      url: '/user/register',
      method: 'post',
      data
    })
  },

  // 用户退出
  logout() {
    return request({
      url: '/user/logout',
      method: 'post'
    })
  },

  // 获取用户信息
  getUserInfo() {
    return request({
      url: '/user/info',
      method: 'get'
    })
  },

  // 检查登录状态
  checkLogin() {
    return request({
      url: '/user/checkLogin',
      method: 'get'
    })
  }
}