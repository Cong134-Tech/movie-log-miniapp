const PLACEHOLDER = '/assets/poster-placeholder.png'

const samples = [
  { id: 'sample-parasite', tmdbId: 496243, title: '寄生虫', originalTitle: '기생충', year: '2019', countries: ['韩国'], director: '奉俊昊', cast: ['宋康昊', '李善均', '赵汝贞'], overview: '一场看似偶然的相遇，让两个家庭的生活逐渐交织，并揭开了阶层与尊严的复杂寓言。', poster: PLACEHOLDER },
  { id: 'sample-inception', tmdbId: 27205, title: '盗梦空间', originalTitle: 'Inception', year: '2010', countries: ['美国', '英国'], director: '克里斯托弗·诺兰', cast: ['莱昂纳多·迪卡普里奥', '约瑟夫·高登-莱维特'], overview: '一名擅长进入他人梦境窃取秘密的盗梦者，接到了一项反向植入想法的任务。', poster: PLACEHOLDER },
  { id: 'sample-spirited-away', tmdbId: 129, title: '千与千寻', originalTitle: '千と千尋の神隠し', year: '2001', countries: ['日本'], director: '宫崎骏', cast: ['柊瑠美', '入野自由', '夏木真理'], overview: '少女千寻误入神灵世界，为了救出父母，她必须在陌生的规则中找到自己的勇气。', poster: PLACEHOLDER },
  { id: 'sample-interstellar', tmdbId: 157336, title: '星际穿越', originalTitle: 'Interstellar', year: '2014', countries: ['美国', '英国'], director: '克里斯托弗·诺兰', cast: ['马修·麦康纳', '安妮·海瑟薇'], overview: '当地球环境日益恶化，一组探险者穿越虫洞，为人类寻找新的家园。', poster: PLACEHOLDER }
]

samples.forEach(movie => {
  movie.poster = `/assets/posters/${movie.id}.png`
  movie.countryLabel = movie.countries.join(' / ')
  movie.castLabel = movie.cast.join('、')
})

function getRecords() {
  const records = wx.getStorageSync('movie-log-records') || []
  return records.map(record => {
    const savedMovie = record.movie || {}
    const sample = samples.find(movie => movie.id === record.movieId || movie.title === savedMovie.title)
    return sample ? { ...record, movie: { ...sample, ...savedMovie, tmdbId: savedMovie.tmdbId || sample.tmdbId, posterPath: savedMovie.posterPath || sample.posterPath || '' } } : record
  })
}

function saveRecords(records) {
  wx.setStorageSync('movie-log-records', records)
}

function getMovieCount(movieId) {
  return getRecords().filter(item => item.movieId === movieId).length
}

function addViewing(movie, payload = {}) {
  const records = getRecords()
  records.unshift({
    id: `${movie.id}-${Date.now()}`,
    movieId: movie.id,
    movie,
    watchedAt: payload.watchedAt || new Date().toISOString().slice(0, 10),
    rating: payload.rating || '',
    note: payload.note || ''
  })
  saveRecords(records)
  return records
}

function distinctMovies() {
  const map = {}
  getRecords().forEach(record => { map[record.movieId] = record.movie })
  return Object.values(map).map(movie => ({ ...movie, watchCount: getMovieCount(movie.id) }))
}

function searchLocal(query) {
  const keyword = (query || '').trim().toLowerCase()
  if (!keyword) return samples
  return samples.filter(movie => [movie.title, movie.originalTitle, movie.director, ...(movie.cast || [])].join(' ').toLowerCase().includes(keyword))
}

module.exports = { samples, getRecords, saveRecords, getMovieCount, addViewing, distinctMovies, searchLocal }
