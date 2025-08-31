import request from '@/utils/request'

export const favoriteApi = {
  // 添加收藏（基础版本）
  addFavorite: (authorId) => {
    return request({
      url: '/user-author-favorite/add',
      method: 'post',
      data: {
        authorId
      }
    })
  },

  // 添加收藏（带设置参数）
  addFavoriteWithSettings: (params) => {
    return request({
      url: '/user-author-favorite/add',
      method: 'post',
      data: params
    })
  },

  // 取消收藏
  removeFavorite: (authorId) => {
    return request({
      url: '/user-author-favorite/remove',
      method: 'delete',
      params: {
        authorId
      }
    })
  },

  // 获取用户收藏的播主列表
  getFavoriteList: (pageNum = 1, pageSize = 10, filters = {}) => {
    const data = {
      pageNum,
      pageSize,
      ...filters
    }
    
    // 清理空值参数
    Object.keys(data).forEach(key => {
      if (data[key] === '' || data[key] === null || data[key] === undefined) {
        delete data[key]
      }
    })
    
    return request({
      url: '/user-author-favorite/list',
      method: 'post',
      data
    })
  },

  // 检查收藏状态
  checkFavoriteStatus: (authorId) => {
    return request({
      url: '/user-author-favorite/check',
      method: 'get',
      params: {
        authorId
      }
    })
  },

  // 获取用户收藏数量
  getUserFavoriteCount: () => {
    return request({
      url: '/user-author-favorite/count/user',
      method: 'get'
    })
  },

  // 获取播主被收藏次数
  getAuthorFavoriteCount: (authorId) => {
    return request({
      url: `/user-author-favorite/count/author/${authorId}`,
      method: 'get'
    })
  },

  // 获取收藏播主详情
  getFavoriteDetail: (authorId) => {
    return request({
      url: `/user-author-favorite/detail/${authorId}`,
      method: 'get'
    })
  },

  // 更新收藏播主配置
  updateFavoriteConfig: (params) => {
    return request({
      url: '/user-author-favorite/update',
      method: 'put',
      data: params
    })
  },

  // 获取音乐统计数据
  getMusicStatistics: () => {
    return request({
      url: '/user-author-favorite/music-statistics',
      method: 'get'
    })
  }
}