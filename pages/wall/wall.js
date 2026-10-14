const { getRecords, getMovieCount } = require('../../utils/movies')
const { FALLBACK_POSTER } = require('../../utils/ui')
const tmdb = require('../../utils/tmdb')
const cloud = require('../../utils/cloud')

function toWallMovies(records) {
  const latestByMovie = {}
  records.forEach(record => {
    if (!record.movie || !record.movieId || latestByMovie[record.movieId]) return
    latestByMovie[record.movieId] = {
      ...record.movie,
      watchCount: getMovieCount(record.movieId),
      lastWatchedAt: record.watchedAt || ''
    }
  })
  return Object.values(latestByMovie)
}

Page({
  data: { movies: [], revealing: false },
  onShow() { this.refresh() },
  refresh() { this.setData({ movies: toWallMovies(getRecords()) }) },
  onPosterError(event) {
    const id = event.currentTarget.dataset.id
    const movie = this.data.movies.find(item => item.id === id)
    if (!movie || movie.poster === FALLBACK_POSTER) return
    if (cloud.isEnabled() && movie.posterPath) {
      this.posterLoads = this.posterLoads || new Set()
      if (this.posterLoads.has(id)) return
      this.posterLoads.add(id)
      tmdb.loadPoster(movie).then(updated => {
        this.setData({ movies: this.data.movies.map(item => item.id === id ? { ...item, poster: updated.poster } : item) })
      }).catch(() => {
        this.setData({ movies: this.data.movies.map(item => item.id === id ? { ...item, poster: FALLBACK_POSTER } : item) })
      }).finally(() => this.posterLoads.delete(id))
      return
    }
    this.setData({ movies: this.data.movies.map(item => item.id === id ? { ...item, poster: FALLBACK_POSTER } : item) })
  },
  openDetail(event) {
    const movie = encodeURIComponent(JSON.stringify(event.currentTarget.dataset.movie))
    wx.navigateTo({ url: `/pages/detail/detail?movie=${movie}` })
  },
  goStats() { wx.switchTab({ url: '/pages/stats/stats' }) }
})
