const { getRecords, distinctMovies } = require('../../utils/movies')

Page({
  data: { movieCount: 0, viewCount: 0, countries: [], latest: [] },
  onShow() {
    const records = getRecords()
    const movies = distinctMovies()
    const byCountry = {}
    movies.forEach(movie => (movie.countries.length ? movie.countries : ['未分类']).forEach(country => { byCountry[country] = (byCountry[country] || 0) + 1 }))
    this.setData({ movieCount: movies.length, viewCount: records.length, countries: Object.keys(byCountry).map(name => ({ name, count: byCountry[name] })).sort((a, b) => b.count - a.count), latest: records.slice(0, 5) })
  },
  configureToken() {
    wx.showModal({
      title: '配置 TMDB Token',
      editable: true,
      placeholderText: '粘贴 API Read Access Token',
      content: wx.getStorageSync('tmdb-token') ? '已配置 Token，可粘贴新 Token 覆盖' : '',
      success: result => {
        if (result.confirm && result.content.trim()) {
          wx.setStorageSync('tmdb-token', result.content.trim())
          wx.showToast({ title: '已保存', icon: 'success' })
        }
      }
    })
  },
  exportRecords() {
    const records = getRecords()
    if (!records.length) return wx.showToast({ title: '还没有观看记录', icon: 'none' })
    wx.setClipboardData({ data: JSON.stringify(records, null, 2), success: () => wx.showToast({ title: '记录已复制', icon: 'success' }) })
  }
})
