const https = require('https')

const HOST = 'api.themoviedb.org'
const TOKEN = process.env.TMDB_API_READ_TOKEN || ''

function request(path, query) {
  return new Promise((resolve, reject) => {
    const params = new URLSearchParams({ ...query, language: 'zh-CN' })
    const request = https.request({
      hostname: HOST,
      path: `/3${path}?${params.toString()}`,
      method: 'GET',
      headers: { Authorization: `Bearer ${TOKEN}`, Accept: 'application/json' },
      timeout: 12000
    }, response => {
      let body = ''
      response.setEncoding('utf8')
      response.on('data', chunk => { body += chunk })
      response.on('end', () => {
        let data
        try { data = JSON.parse(body) } catch (error) { return reject(new Error(`TMDB 返回了无效数据（${response.statusCode}）`)) }
        if (response.statusCode < 200 || response.statusCode >= 300) return reject(new Error(data.status_message || `TMDB ${response.statusCode}`))
        resolve(data)
      })
    })
    request.on('timeout', () => request.destroy(new Error('TMDB 请求超时')))
    request.on('error', reject)
    request.end()
  })
}

function requestImage(path) {
  return new Promise((resolve, reject) => {
    const request = https.get({ hostname: 'image.tmdb.org', path, timeout: 12000 }, response => {
      if (response.statusCode !== 200) {
        response.resume()
        return reject(new Error(`海报服务返回 ${response.statusCode}`))
      }
      const chunks = []
      let size = 0
      response.on('data', chunk => {
        size += chunk.length
        if (size > 3 * 1024 * 1024) request.destroy(new Error('海报图片超出大小限制'))
        else chunks.push(chunk)
      })
      response.on('end', () => resolve(Buffer.concat(chunks)))
    })
    request.on('timeout', () => request.destroy(new Error('海报请求超时')))
    request.on('error', reject)
  })
}

exports.main = async event => {
  if (!TOKEN) return { ok: false, message: '云函数尚未配置 TMDB_API_READ_TOKEN' }
  try {
    if (event.action === 'search') {
      if (!event.query) return { ok: true, data: { results: [] } }
      return { ok: true, data: await request('/search/movie', { query: event.query, include_adult: 'false', page: '1' }) }
    }
    if (event.action === 'detail') {
      if (!event.movieId) return { ok: false, message: '缺少电影编号' }
      return { ok: true, data: await request(`/movie/${encodeURIComponent(event.movieId)}`, { append_to_response: 'credits' }) }
    }
    if (event.action === 'poster') {
      const posterPath = String(event.posterPath || '')
      if (!/^\/[A-Za-z0-9/_-]+\.(jpg|jpeg|png|webp)$/i.test(posterPath)) return { ok: false, message: '海报路径无效' }
      const image = await requestImage(`/t/p/w500${posterPath}`)
      return { ok: true, data: { base64: image.toString('base64') } }
    }
    return { ok: false, message: '不支持的请求类型' }
  } catch (error) {
    return { ok: false, message: error.message || '电影资料请求失败' }
  }
}
