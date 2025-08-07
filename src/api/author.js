import request from '@/utils/request'

export const authorApi = {
  // 根据用户ID获取播主信息
  getAuthorInfo(userId) {
    return request({
      url: `/author/info/${userId}`,
      method: 'get'
    })
  },

  // 根据昵称获取播主信息
  getAuthorByNickname(nickname) {
    return request({
      url: `/author/nickname/${nickname}`,
      method: 'get'
    })
  },

  // 根据昵称模糊搜索播主
  searchAuthorByNickname(nickname) {
    return request({
      url: `/author/search/nickname/${nickname}`,
      method: 'get'
    })
  },

  // 获取所有播主列表
  getAuthorList() {
    return request({
      url: '/author/list',
      method: 'get'
    })
  },

  // 获取播主详细信息（包括作品列表）
  getAuthorDetails(userId) {
    return request({
      url: `/author/details/${userId}`,
      method: 'get'
    })
  },

  // 多条件搜索播主
  searchAuthor(params) {
    return request({
      url: '/author/search',
      method: 'get',
      params
    })
  }
}
