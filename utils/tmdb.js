const API_BASE = 'https://api.themoviedb.org/3'
const IMAGE_BASE = 'https://image.tmdb.org/t/p/w500'
const { FALLBACK_POSTER } = require('./ui')
const cloud = require('./cloud')

function request(path, token, data = {}) {
  return new Promise((resolve, reject) => {
    wx.request({
      url: `${API_BASE}${path}`,
      data,
      header: { Authorization: `Bearer ${token}`, 'Content-Type': 'application/json;charset=utf-8' },
      success: result => result.statusCode >= 200 && result.statusCode < 300 ? resolve(result.data) : reject(new Error(`TMDB ${result.statusCode}`)),
      fail: reject
    })
  })
}

function normalize(movie) {
  const normalized = {
    id: `tmdb-${movie.id}`,
    tmdbId: movie.id,
    posterPath: movie.poster_path || '',
    title: movie.title || movie.name || '未命名电影',
    originalTitle: movie.original_title || movie.original_name || '',
    year: (movie.release_date || movie.first_air_date || '').slice(0, 4),
    countries: movie.production_countries ? movie.production_countries.map(item => item.name) : [],
    director: '',
    cast: [],
    overview: movie.overview || '暂无剧情简介',
    poster: movie.poster_path ? `${IMAGE_BASE}${movie.poster_path}` : FALLBACK_POSTER
  }
  normalized.countryLabel = normalized.countries.join(' / ')
  normalized.castLabel = normalized.cast.join('、')
  return normalized
}

async function searchMovies(query, token) {
  if (cloud.isEnabled()) {
    const data = await cloud.call('search', { query })
    return (data.results || []).map(normalize)
  }
  const data = await request('/search/movie', token, { query, language: 'zh-CN', include_adult: false, page: 1 })
  return (data.results || []).map(normalize)
}

async function getMovie(movieId, token) {
  if (cloud.isEnabled()) {
    const data = await cloud.call('detail', { movieId })
    return normalizeDetail(data)
  }
  const data = await request(`/movie/${movieId}`, token, { language: 'zh-CN', append_to_response: 'credits' })
  return normalizeDetail(data)
}

async function loadPoster(movie) {
  if (!cloud.isEnabled() || !movie || !movie.posterPath) return movie
  const poster = await cloud.cachePoster(movie.tmdbId, movie.posterPath)
  return { ...movie, poster }
}

function normalizeDetail(data) {
  const movie = normalize(data)
  const crew = (data.credits && data.credits.crew) || []
  const cast = (data.credits && data.credits.cast) || []
  movie.director = crew.find(person => person.job === 'Director')?.name || ''
  movie.cast = cast.slice(0, 6).map(person => person.name)
  movie.countries = (data.production_countries || []).map(item => item.name)
  movie.countryLabel = movie.countries.join(' / ')
  movie.castLabel = movie.cast.join('、')
  return movie
}

module.exports = { searchMovies, getMovie, loadPoster }
