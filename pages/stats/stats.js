const { getRecords, distinctMovies } = require('../../utils/movies')
const { FALLBACK_POSTER } = require('../../utils/ui')
const tmdb = require('../../utils/tmdb')
const cloud = require('../../utils/cloud')

Page({
  data: { movieCount: 0, viewCount: 0, countries: [], latest: [], tokenConfigured: false, tokenSheetVisible: false, tokenDraft: '', tokenError: '', revealing: false },
  onShow() {
    const records = getRecords()
    const movies = distinctMovies()
    const byCountry = {}
    movies.forEach(movie => {
      const countries = Array.isArray(movie.countries) && movie.countries.length ? [...new Set(movie.countries)] : ['未分类']
      countries.forEach(country => { byCountry[country] = (byCountry[country] || 0) + 1 })
    })
    this.setData({
      movieCount: movies.length, viewCount: records.length,
      countries: Object.keys(byCountry).map(name => ({ name, count: byCountry[name], percent: Math.round(byCountry[name] / movies.length * 100) })).sort((a, b) => b.count - a.count),
      latest: records.slice(0, 5), tokenConfigured: Boolean(wx.getStorageSync('tmdb-token') || cloud.isEnabled())
    })
  },
  onHide() { if (this.data.tokenSheetVisible) this.closeTokenSheet() },
  onUnload() { if (this.data.tokenSheetVisible) wx.showTabBar({ animation: false }) },
  configureToken() {
    this.setData({ tokenSheetVisible: true, tokenDraft: '', tokenError: '' })
    wx.hideTabBar({ animation: true })
  },
  closeTokenSheet() {
    this.setData({ tokenSheetVisible: false, tokenDraft: '', tokenError: '' })
    wx.showTabBar({ animation: true })
  },
  stopTouch() {},
  onTokenInput(event) { this.setData({ tokenDraft: event.detail.value, tokenError: '' }) },
  saveToken() {
    const token = this.data.tokenDraft.trim()
    if (!token) return this.setData({ tokenError: '请先粘贴 API Read Access Token。' })
    wx.setStorageSync('tmdb-token', token)
    this.setData({ tokenConfigured: true })
    this.closeTokenSheet()
    wx.showToast({ title: '已保存', icon: 'success' })
  },
  onPosterError(event) {
    const id = event.currentTarget.dataset.id
    const record = this.data.latest.find(item => item.movie.id === id)
    if (!record || record.movie.poster === FALLBACK_POSTER) return
    if (cloud.isEnabled() && record.movie.posterPath) {
      this.posterLoads = this.posterLoads || new Set()
      if (this.posterLoads.has(id)) return
      this.posterLoads.add(id)
      tmdb.loadPoster(record.movie).then(updated => {
        this.setData({ latest: this.data.latest.map(item => item.movie.id === id ? { ...item, movie: { ...item.movie, poster: updated.poster } } : item) })
      }).catch(() => {
        this.setData({ latest: this.data.latest.map(item => item.movie.id === id ? { ...item, movie: { ...item.movie, poster: FALLBACK_POSTER } } : item) })
      }).finally(() => this.posterLoads.delete(id))
      return
    }
    this.setData({ latest: this.data.latest.map(item => item.movie.id === id ? { ...item, movie: { ...item.movie, poster: FALLBACK_POSTER } } : item) })
  },
  openDetail(event) {
    const movie = encodeURIComponent(JSON.stringify(event.currentTarget.dataset.movie))
    wx.navigateTo({ url: `/pages/detail/detail?movie=${movie}` })
  },
  exportRecords() {
    const records = getRecords()
    if (!records.length) return wx.showToast({ title: '还没有观看记录', icon: 'none' })
    wx.setClipboardData({ data: JSON.stringify(records, null, 2), success: () => wx.showToast({ title: '记录已复制', icon: 'success' }) })
  }
})
