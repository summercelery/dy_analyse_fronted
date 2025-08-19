import request from '@/utils/request'

export const hotspotApi = {
  // 分页查询热度提醒列表
  getAlertList(params = {}) {
    return request({
      url: '/hotspot-alert/list',
      method: 'post',
      data: params
    })
  },

  // 根据视频ID查询提醒记录
  getVideoAlerts(awemeId) {
    return request({
      url: `/hotspot-alert/video/${awemeId}`,
      method: 'get'
    })
  },

  // 获取最近的热度提醒记录
  getRecentAlerts(limit = 10) {
    return request({
      url: '/hotspot-alert/recent',
      method: 'get',
      params: { limit }
    })
  },

  // 根据音乐ID查询热度提醒
  getMusicAlerts(musicId, days = 30) {
    return request({
      url: `/hotspot-alert/music/${musicId}`,
      method: 'get',
      params: { days }
    })
  },

  // 根据音乐ID分页查询热度提醒
  getMusicAlertList(musicId, params = {}) {
    return request({
      url: `/hotspot-alert/music/${musicId}/list`,
      method: 'post',
      data: params
    })
  },

  // 获取音乐热度提醒统计
  getMusicStatistics(musicId, days = 30) {
    return request({
      url: `/hotspot-alert/music/${musicId}/statistics`,
      method: 'get',
      params: { days }
    })
  },

  // 获取音乐热度趋势数据
  getMusicTrend(musicId, days = 7) {
    return request({
      url: `/hotspot-alert/music/${musicId}/trend`,
      method: 'get',
      params: { days }
    })
  },

  // 获取全局热度提醒统计
  getGlobalStatistics() {
    return request({
      url: '/hotspot-alert/statistics',
      method: 'get'
    })
  },

  // 根据提醒级别查询
  getAlertsByLevel(alertLevel, days = 7) {
    return request({
      url: `/hotspot-alert/level/${alertLevel}`,
      method: 'get',
      params: { days }
    })
  },

  // 获取全局热度趋势
  getGlobalTrend(days = 7) {
    return request({
      url: '/hotspot-alert/trend',
      method: 'get',
      params: { days }
    })
  },

  // 手动触发热度检测
  triggerDetection(awemeId) {
    return request({
      url: '/hotspot-alert/trigger',
      method: 'post',
      params: { awemeId }
    })
  },

  // 删除热度提醒记录
  deleteAlert(id) {
    return request({
      url: `/hotspot-alert/${id}`,
      method: 'delete'
    })
  },

  // 批量删除热度提醒记录
  batchDeleteAlerts(ids) {
    return request({
      url: '/hotspot-alert/batch',
      method: 'delete',
      data: ids
    })
  }
}