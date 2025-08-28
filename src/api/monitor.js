import request from '@/utils/request'

export const monitorApi = {
  // 获取监控视频列表
  getMonitorList(params = {}) {
    return request({
      url: '/monitor/list',
      method: 'get',
      params,
      paramsSerializer: {
        serialize: (params) => {
          const searchParams = new URLSearchParams()
          Object.keys(params).forEach(key => {
            const value = params[key]
            if (Array.isArray(value)) {
              // 对于数组参数，使用JSON格式并进行URL编码
              searchParams.append(key, JSON.stringify(value))
            } else if (value !== undefined && value !== null) {
              searchParams.append(key, value)
            }
          })
          return searchParams.toString()
        }
      }
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
  },

  // Excel批量添加监控视频（同步版本）
  uploadExcel(formData) {
    return request({
      url: '/monitor/upload/excel',
      method: 'post',
      data: formData,
      headers: {
        'Content-Type': 'multipart/form-data'
      }
    })
  },

  // Excel批量添加监控视频（异步版本）
  uploadExcelAsync(formData) {
    return request({
      url: '/monitor/upload/excel/async',
      method: 'post',
      data: formData,
      headers: {
        'Content-Type': 'multipart/form-data'
      }
    })
  },

  // 查询导入任务进度
  getTaskProgress(taskId) {
    return request({
      url: `/import-task/${taskId}/progress`,
      method: 'get'
    })
  },

  // 查询任务详情
  getTaskDetails(taskId) {
    return request({
      url: `/import-task/${taskId}`,
      method: 'get'
    })
  },

  // 查询用户任务列表
  getUserTasks(limit = 10) {
    return request({
      url: `/import-task/list?limit=${limit}`,
      method: 'get'
    })
  },

  // 获取监控统计概览
  getMonitorStatistics(params) {
    return request({
      url: '/monitor/statistics',
      method: 'get',
      params,
      paramsSerializer: {
        serialize: (params) => {
          const searchParams = new URLSearchParams()
          Object.keys(params).forEach(key => {
            const value = params[key]
            if (Array.isArray(value)) {
              // 对于数组参数，使用JSON格式并进行URL编码
              searchParams.append(key, JSON.stringify(value))
            } else if (value !== undefined && value !== null) {
              searchParams.append(key, value)
            }
          })
          return searchParams.toString()
        }
      }
    })
  },

  // 获取搜索标签统计
  getMonitorTags(musicId) {
    return request({
      url: '/monitor/tags',
      method: 'get',
      params: {
        musicId
      }
    })
  },

  // 获取搜索频道统计
  getMonitorChannels(musicId) {
    return request({
      url: '/monitor/channels',
      method: 'get',
      params: {
        musicId
      }
    })
  },

  // 更新监控视频自选状态
  updateCustomSelection(data) {
    return request({
      url: '/monitor/custom-selection',
      method: 'put',
      data
    })
  },

  // 查询视频投资记录
  getVideoInvestments(awemeId) {
    return request({
      url: `/investment/video/${awemeId}`,
      method: 'get'
    })
  },

  // 删除热度提醒
  deleteHotspotAlert(id) {
    return request({
      url: `/hotspot-alert/${id}`,
      method: 'delete'
    })
  }
}