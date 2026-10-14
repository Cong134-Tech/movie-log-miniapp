// Replays a short blur-to-focus transition when a page becomes visible.
function revealPage(page) {
  page.setData({ revealing: false })
  wx.nextTick(() => page.setData({ revealing: true }))
}
const FALLBACK_POSTER = '/assets/poster-placeholder.png'
module.exports = { revealPage, FALLBACK_POSTER }
