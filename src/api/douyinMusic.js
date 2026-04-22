import request from '@/utils/request'

export const douyinMusicApi = {
  getDouyinMusicList(musicId) {
    return request({
      url: '/douyin-music/list',
      method: 'get',
      params: { musicId }
    })
  },

  getDouyinMusicHistory(douyinMusicId) {
    return request({
      url: `/douyin-music/${douyinMusicId}/history`,
      method: 'get'
    })
  }
}
