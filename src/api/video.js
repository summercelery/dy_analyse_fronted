import request from '@/utils/request'

export const videoApi = {
  // 获取视频信息
  getVideoInfo(awemeId) {
    return request({
      url: `/video/info/${awemeId}`,
      method: 'get'
    })
  },

  // 获取视频统计数据
  getVideoStats(awemeId) {
    return request({
      url: `/video/stats/${awemeId}`,
      method: 'get'
    })
  },

  // 获取视频统计图表数据
  getVideoStatsChart(awemeId, days = 7) {
    return request({
      url: `/video/stats/chart/${awemeId}`,
      method: 'get',
      params: { days }
    })
  },

  // 获取最新视频统计数据
  getLatestVideoStats(awemeId) {
    return request({
      url: `/video/stats/latest/${awemeId}`,
      method: 'get'
    })
  },

  // 获取监控视频详细信息
  getMonitorVideoDetails() {
    return request({
      url: '/video/monitor/details',
      method: 'get'
    })
  }
}