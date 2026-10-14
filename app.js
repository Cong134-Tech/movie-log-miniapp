const { CLOUD_ENV_ID } = require('./utils/cloud')

App({
  globalData: {
    cloudEnabled: Boolean(CLOUD_ENV_ID),
    recordsKey: 'movie-log-records'
  },
  onLaunch() {
    if (CLOUD_ENV_ID && wx.cloud) wx.cloud.init({ env: CLOUD_ENV_ID, traceUser: false })
  }
})
