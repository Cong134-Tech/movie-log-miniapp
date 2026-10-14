const { searchLocal, addViewing, getMovieCount } = require('../../utils/movies')
const tmdb = require('../../utils/tmdb')
const { FALLBACK_POSTER } = require('../../utils/ui')
const cloud = require('../../utils/cloud')

Page({
  data: { query: '', results: searchLocal(''), loading: false, usingDemo: true, tokenConfigured: false, revealing: false },
  onLoad() { this.search() },
  onShow() {
    this.setData({
      tokenConfigured: Boolean(wx.getStorageSync('tmdb-token') || cloud.isEnabled()),
      results: this.data.results.map(movie => ({ ...movie, watchCount: getMovieCount(movie.id) }))
    })
  },
  onInput(event) { this.setData({ query: event.detail.value }) },
  async search() {
    const query = this.data.query.trim()
    this.setData({ loading: true })
    const token = wx.getStorageSync('tmdb-token')
    const onlineEnabled = Boolean(token || cloud.isEnabled())
    try {
      const results = onlineEnabled && query ? await tmdb.searchMovies(query, token) : searchLocal(query)
      const nextResults = results.map(movie => ({ ...movie, watchCount: getMovieCount(movie.id) }))
      const usingDemo = !(onlineEnabled && query)
      this.setData({ results: nextResults, loading: false, usingDemo, tokenConfigured: onlineEnabled })
      this.hydratePosters(nextResults)
    } catch (error) {
      this.setData({ results: searchLocal(query).map(movie => ({ ...movie, watchCount: getMovieCount(movie.id) })), loading: false, usingDemo: true })
      const message = error && error.errMsg ? error.errMsg : error && error.message ? error.message : '云函数连接失败'
      wx.showToast({ title: `搜索失败：${message.slice(0, 18)}`, icon: 'none', duration: 3000 })
    }
  },
  async hydratePosters(movies) {
    if (!cloud.isEnabled() || !movies.length) return
    const updates = await Promise.all(movies.map(async movie => {
      if (!movie.tmdbId) return movie
      try {
        const detail = await tmdb.getMovie(movie.tmdbId)
        const hydrated = await tmdb.loadPoster(detail)
        return { ...movie, ...hydrated, id: movie.id, watchCount: getMovieCount(movie.id) }
      } catch (error) {
        try {
          const detail = await tmdb.getMovie(movie.tmdbId)
          return { ...movie, ...detail, id: movie.id, watchCount: getMovieCount(movie.id) }
        } catch (fallbackError) { return movie }
      }
    }))
    if (updates.some((movie, index) => movie.poster !== movies[index].poster || movie.title !== movies[index].title)) this.setData({ results: updates })
  },
  onPosterError(event) {
    const id = event.currentTarget.dataset.id
    const movie = this.data.results.find(item => item.id === id)
    if (!movie || movie.poster === FALLBACK_POSTER) return
    if (cloud.isEnabled() && movie.posterPath) {
      this.posterLoads = this.posterLoads || new Set()
      if (this.posterLoads.has(id)) return
      this.posterLoads.add(id)
      tmdb.loadPoster(movie).then(updated => {
        this.setData({ results: this.data.results.map(item => item.id === id ? { ...item, poster: updated.poster } : item) })
      }).catch(() => {
        this.setData({ results: this.data.results.map(item => item.id === id ? { ...item, poster: FALLBACK_POSTER } : item) })
      }).finally(() => this.posterLoads.delete(id))
      return
    }
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
