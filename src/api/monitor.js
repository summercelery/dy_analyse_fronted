import request from '@/utils/request'

export const monitorApi = {
  // 获取监控视频列表
  getMonitorList() {
    return request({
      url: '/monitor/list',
      method: 'get'
    })
  },

  // 添加监控视频
  addMonitor(data) {
    return request({
      url: '/monitor/add',
      method: 'post',
      data
    })
  },

  // 更新监控状态
  updateStatus(id, data) {
    return request({
      url: `/monitor/status/${id}`,
      method: 'put',
      data
    })
  },

  // 删除监控视频
  deleteMonitor(id) {
    return request({
      url: `/monitor/${id}`,
      method: 'delete'
    })
  }
}