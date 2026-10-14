const { distinctMovies } = require('../../utils/movies')

Page({
  data: { movies: [], filter: '' },
  onShow() { this.refresh() },
  refresh() {
    const all = distinctMovies()
    const filter = this.data.filter
    this.setData({ movies: filter ? all.filter(movie => movie.countries.includes(filter)) : all })
  },
  chooseFilter() {
    const countries = [...new Set(distinctMovies().flatMap(movie => movie.countries))]
    wx.showActionSheet({ itemList: ['全部国家', ...countries], success: result => { this.setData({ filter: result.tapIndex ? countries[result.tapIndex - 1] : '' }); this.refresh() } })
  },
  openDetail(event) {
    const movie = encodeURIComponent(JSON.stringify(event.currentTarget.dataset.movie))
    wx.navigateTo({ url: `/pages/detail/detail?movie=${movie}` })
  }
})
