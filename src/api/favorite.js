import request from '@/utils/request'

export const favoriteApi = {
  // 添加收藏（基础版本）
  addFavorite: (userId, authorUserId) => {
    return request({
      url: '/user-author-favorite/add',
      method: 'post',
      params: {
        userId,
        authorUserId
      }
    })
  },

  // 添加收藏（带设置参数）
  addFavoriteWithSettings: (params) => {
    return request({
      url: '/user-author-favorite/add',
      method: 'post',
      params
    })
  },

  // 取消收藏
  removeFavorite: (userId, authorUserId) => {
    return request({
      url: '/user-author-favorite/remove',
      method: 'delete',
      params: {
        userId,
        authorUserId
      }
    })
  },

  // 获取用户收藏的播主列表
  getFavoriteList: (userId) => {
    return request({
      url: `/user-author-favorite/list/${userId}`,
      method: 'get'
    })
  },

  // 检查收藏状态
  checkFavoriteStatus: (userId, authorUserId) => {
    return request({
      url: '/user-author-favorite/check',
      method: 'get',
      params: {
        userId,
        authorUserId
      }
    })
  },

  // 获取用户收藏数量
  getUserFavoriteCount: (userId) => {
    return request({
      url: `/user-author-favorite/count/user/${userId}`,
      method: 'get'
    })
  },

  // 获取播主被收藏次数
  getAuthorFavoriteCount: (authorUserId) => {
    return request({
      url: `/user-author-favorite/count/author/${authorUserId}`,
      method: 'get'
    })
  }
}