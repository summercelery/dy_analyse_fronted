import request from '@/utils/request'

export const videoApi = {
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
  }
}