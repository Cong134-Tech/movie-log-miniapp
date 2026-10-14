const { searchLocal, addViewing, getMovieCount } = require('../../utils/movies')
const tmdb = require('../../utils/tmdb')

Page({
  data: { query: '', results: searchLocal(''), loading: false, usingDemo: true },
  onLoad() { this.search() },
  onInput(event) { this.setData({ query: event.detail.value }) },
  async search() {
    const query = this.data.query.trim()
    this.setData({ loading: true })
    const token = wx.getStorageSync('tmdb-token')
    try {
      const results = token && query ? await tmdb.searchMovies(query, token) : searchLocal(query)
      this.setData({ results, loading: false, usingDemo: !token })
    } catch (error) {
      this.setData({ results: searchLocal(query), loading: false, usingDemo: true })
      wx.showToast({ title: '真实搜索暂不可用，已切换示例', icon: 'none' })
    }
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
