import request from '@/utils/request'

export const musicApi = {
  // 根据ID获取音乐信息
  getMusicById(id) {
    return request({
      url: `/music/info/${id}`,
      method: 'get'
    })
  },

  // 根据标题获取音乐信息
  getMusicByTitle(title) {
    return request({
      url: `/music/title/${title}`,
      method: 'get'
    })
  },

  // 根据作者获取音乐列表
  getMusicByAuthor(author) {
    return request({
      url: `/music/author/${author}`,
      method: 'get'
    })
  },

  // 根据专辑获取音乐列表
  getMusicByAlbum(album) {
    return request({
      url: `/music/album/${album}`,
      method: 'get'
    })
  },

  // 搜索音乐
  searchMusic(keyword) {
    return request({
      url: '/music/search',
      method: 'get',
      params: { keyword }
    })
  },

  // 获取所有音乐列表
  getMusicList() {
    return request({
      url: '/music/list',
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
  }
}
