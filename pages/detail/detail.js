const { addViewing, getMovieCount } = require('../../utils/movies')
const tmdb = require('../../utils/tmdb')

Page({
  data: { movie: {}, watchCount: 0, note: '', watchedAt: '', loading: false },
  onLoad(options) {
    const movie = JSON.parse(decodeURIComponent(options.movie || '{}'))
    this.setData({ movie, watchCount: getMovieCount(movie.id), watchedAt: new Date().toISOString().slice(0, 10) })
    const token = wx.getStorageSync('tmdb-token')
    if (token && movie.tmdbId && (!movie.director || !movie.cast.length)) this.loadFull(movie.tmdbId, token)
  },
  async loadFull(id, token) {
    this.setData({ loading: true })
    try { this.setData({ movie: await tmdb.getMovie(id, token), loading: false }) } catch (error) { this.setData({ loading: false }) }
  },
  onDateChange(event) { this.setData({ watchedAt: event.detail.value }) },
  onNoteInput(event) { this.setData({ note: event.detail.value }) },
  markWatched() {
    addViewing(this.data.movie, { watchedAt: this.data.watchedAt, note: this.data.note })
    this.setData({ watchCount: this.data.watchCount + 1, note: '' })
    wx.showToast({ title: '已记录这次观看', icon: 'success' })
  }
})
