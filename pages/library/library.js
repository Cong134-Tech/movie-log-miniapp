const { distinctMovies, getRecords } = require('../../utils/movies')
const { revealPage, FALLBACK_POSTER } = require('../../utils/ui')

Page({
  data: { movies: [], countries: [], filter: '', filterOpen: false, totalCount: 0, totalViews: 0, revealing: false },
  onShow() { this.refresh(); revealPage(this) },
  refresh() {
    const all = distinctMovies()
    const countries = [...new Set(all.reduce((list, movie) => list.concat(movie.countries || []), []))]
    const filter = countries.includes(this.data.filter) ? this.data.filter : ''
    this.setData({
      countries, filter, totalCount: all.length, totalViews: getRecords().length,
      movies: filter ? all.filter(movie => (movie.countries || []).includes(filter)) : all
    })
  },
  chooseFilter() { this.setData({ filterOpen: !this.data.filterOpen }) },
  setFilter(event) { this.setData({ filter: event.currentTarget.dataset.country || '' }); this.refresh() },
  onPosterError(event) {
    const id = event.currentTarget.dataset.id
    const movie = this.data.movies.find(item => item.id === id)
    if (!movie || movie.poster === FALLBACK_POSTER) return
    this.setData({ movies: this.data.movies.map(item => item.id === id ? { ...item, poster: FALLBACK_POSTER } : item) })
  },
  goDiscover() { wx.switchTab({ url: '/pages/home/home' }) },
  openDetail(event) {
    const movie = encodeURIComponent(JSON.stringify(event.currentTarget.dataset.movie))
    wx.navigateTo({ url: `/pages/detail/detail?movie=${movie}` })
  }
})
