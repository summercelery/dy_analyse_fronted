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
  }
}