import request from '@/utils/request'

export const channelTypeApi = {
  getList: () => {
    return request({
      url: '/channel-type/list',
      method: 'get'
    })
  },

  add: (params) => {
    return request({
      url: '/channel-type/add',
      method: 'post',
      data: params
    })
  },

  update: (params) => {
    return request({
      url: '/channel-type/update',
      method: 'put',
      data: params
    })
  },

  delete: (id) => {
    return request({
      url: `/channel-type/delete/${id}`,
      method: 'delete'
    })
  }
}
