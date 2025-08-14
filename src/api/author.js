import request from '@/utils/request'

export const authorApi = {
  // 根据用户ID获取播主信息
  getAuthorInfo(userId) {
    return request({
      url: `/author/info/${userId}`,
      method: 'get'
    })
  }
}
