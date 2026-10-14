const { addViewing, getMovieCount } = require('../../utils/movies')
const tmdb = require('../../utils/tmdb')
const { revealPage, FALLBACK_POSTER } = require('../../utils/ui')
const cloud = require('../../utils/cloud')

function todayLocal() {
  const date = new Date()
  return [date.getFullYear(), String(date.getMonth() + 1).padStart(2, '0'), String(date.getDate()).padStart(2, '0')].join('-')
}

Page({
  data: { movie: {}, watchCount: 0, note: '', watchedAt: '', loading: false, revealing: false },
  onLoad(options) {
    const movie = JSON.parse(decodeURIComponent(options.movie || '{}'))
    this.setData({ movie, watchCount: getMovieCount(movie.id), watchedAt: todayLocal() })
    const token = wx.getStorageSync('tmdb-token')
    if ((token || cloud.isEnabled()) && movie.tmdbId && (!movie.director || !movie.cast || !movie.cast.length)) this.loadFull(movie.tmdbId, token)
    else if (cloud.isEnabled() && movie.tmdbId && movie.posterPath) this.loadPoster(movie)
  },
  onShow() { revealPage(this) },
  async loadFull(id, token) {
    this.setData({ loading: true })
    try {
      let movie = await tmdb.getMovie(id, token)
      if (cloud.isEnabled()) movie = await tmdb.loadPoster(movie).catch(() => movie)
      this.setData({ movie, loading: false })
    } catch (error) { this.setData({ loading: false }) }
  },
  async loadPoster(movie) {
    try { this.setData({ movie: await tmdb.loadPoster(movie) }) } catch (error) {}
  },
  onPosterError() {
    if (this.data.movie.poster !== FALLBACK_POSTER) this.setData({ 'movie.poster': FALLBACK_POSTER })
  },
  onDateChange(event) { this.setData({ watchedAt: event.detail.value }) },
  onNoteInput(event) { this.setData({ note: event.detail.value }) },
  markWatched() {
    addViewing(this.data.movie, { watchedAt: this.data.watchedAt, note: this.data.note })
    this.setData({ watchCount: getMovieCount(this.data.movie.id), note: '' })
    wx.showToast({ title: '已记录这次观看', icon: 'success' })
  }
})
