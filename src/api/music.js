import request from '@/utils/request'

export const musicApi = {
  // 根据ID获取音乐信息
  getMusicById(id) {
    return request({
      url: `/music/info/${id}`,
      method: 'get'
    })
  },

  // 扩展搜索音乐（包括标签搜索）
  searchMusicExtended(keyword) {
    return request({
      url: '/music/search/extended',
      method: 'get',
      params: { keyword }
    })
  },

  // 获取所有音乐列表（包含热度信息）
  getMusicList() {
    return request({
      url: '/music/list/with-hotness',
      method: 'get'
    })
  },

  // 添加音乐
  addMusic(data) {
    return request({
      url: '/music/add',
      method: 'post',
      data
    })
  },

  // 更新音乐信息
  updateMusic(data) {
    return request({
      url: '/music/update',
      method: 'put',
      data
    })
  },

  // 删除音乐
  deleteMusic(id) {
    return request({
      url: `/music/${id}`,
      method: 'delete'
    })
  },

  // 获取音乐热度图表数据
  getMusicHotnessChart(musicId, days = 7) {
    return request({
      url: `/music/hotness/stats/chart/${musicId}`,
      method: 'get',
      params: { days }
    })
  }
}
