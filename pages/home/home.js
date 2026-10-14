const { searchLocal, addViewing, getMovieCount } = require('../../utils/movies')
const tmdb = require('../../utils/tmdb')
const { revealPage, FALLBACK_POSTER } = require('../../utils/ui')

Page({
  data: { query: '', results: searchLocal(''), loading: false, usingDemo: true, tokenConfigured: false, revealing: false },
  onLoad() { this.search() },
  onShow() {
    this.setData({
      tokenConfigured: Boolean(wx.getStorageSync('tmdb-token')),
      results: this.data.results.map(movie => ({ ...movie, watchCount: getMovieCount(movie.id) }))
    })
    revealPage(this)
  },
  onInput(event) { this.setData({ query: event.detail.value }) },
  async search() {
    const query = this.data.query.trim()
    this.setData({ loading: true })
    const token = wx.getStorageSync('tmdb-token')
    try {
      const results = token && query ? await tmdb.searchMovies(query, token) : searchLocal(query)
      this.setData({ results: results.map(movie => ({ ...movie, watchCount: getMovieCount(movie.id) })), loading: false, usingDemo: !(token && query), tokenConfigured: Boolean(token) })
    } catch (error) {
      this.setData({ results: searchLocal(query).map(movie => ({ ...movie, watchCount: getMovieCount(movie.id) })), loading: false, usingDemo: true })
      wx.showToast({ title: '真实搜索暂不可用，已切换示例', icon: 'none' })
    }
  },
  onPosterError(event) {
    const id = event.currentTarget.dataset.id
    const movie = this.data.results.find(item => item.id === id)
    if (!movie || movie.poster === FALLBACK_POSTER) return
    this.setData({ results: this.data.results.map(item => item.id === id ? { ...item, poster: FALLBACK_POSTER } : item) })
  },
  openDetail(event) {
    const movie = encodeURIComponent(JSON.stringify(event.currentTarget.dataset.movie))
    wx.navigateTo({ url: `/pages/detail/detail?movie=${movie}` })
  },
  markWatched(event) {
    addViewing(event.currentTarget.dataset.movie)
    this.setData({ results: this.data.results.map(movie => ({ ...movie, watchCount: getMovieCount(movie.id) })) })
    wx.showToast({ title: '已记为看过', icon: 'success' })
  }
})
