// Fill this with the CloudBase environment ID after creating a cloud environment.
// Leave it empty to keep the local/direct TMDB fallback while developing.
const CLOUD_ENV_ID = ''
const CLOUD_FUNCTION = 'tmdbProxy'

function isEnabled() {
  return Boolean(CLOUD_ENV_ID && wx.cloud)
}

function call(action, payload = {}) {
  return new Promise((resolve, reject) => {
    wx.cloud.callFunction({
      name: CLOUD_FUNCTION,
      data: { action, ...payload },
      success: response => {
        const result = response && response.result
        if (result && result.ok === false) return reject(new Error(result.message || '云函数请求失败'))
        resolve(result && result.data !== undefined ? result.data : result)
      },
      fail: reject
    })
  })
}

function cachePoster(movieId, posterPath) {
  return new Promise((resolve, reject) => {
    const filePath = `${wx.env.USER_DATA_PATH}/tmdb-poster-${movieId}.jpg`
    const fs = wx.getFileSystemManager()
    try {
      fs.accessSync(filePath)
      return resolve(filePath)
    } catch (error) {}
    call('poster', { posterPath }).then(result => {
      if (!result || !result.base64) return reject(new Error('海报图片为空'))
      fs.writeFile({
        filePath,
        data: result.base64,
        encoding: 'base64',
        success: () => resolve(filePath),
        fail: reject
      })
    }).catch(reject)
  })
}

module.exports = { CLOUD_ENV_ID, isEnabled, call, cachePoster }
