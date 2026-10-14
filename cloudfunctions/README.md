# TMDB 云函数代理

这个函数让小程序手机端只调用微信云函数，由云函数请求 TMDB，避免手机直接访问 `api.themoviedb.org`。TMDB Read Access Token 只配置在云函数环境变量中，不写进小程序和 GitHub。

## 配置一次即可

1. 在微信开发者工具或 CloudBase 控制台创建云开发环境。可优先尝试新加坡地域，让服务器在云端请求 TMDB；记下环境 ID。具体是否能从该区域访问 TMDB，要部署后实测。
2. 为 `tmdbProxy` 云函数设置环境变量 `TMDB_API_READ_TOKEN`，值为 TMDB API Read Access Token。
3. 把环境 ID 填入 `utils/cloud.js` 的 `CLOUD_ENV_ID`。
4. 右键 `cloudfunctions/tmdbProxy` 部署云函数，或执行：

```text
cli cloud functions deploy --env 你的环境ID --names tmdbProxy --project 项目目录
```

5. 重新上传小程序体验版。配置成功后，`utils/tmdb.js` 会优先走云函数；未配置时继续使用本地直连方式，方便开发者工具测试。

云函数不接收或保存观影记录；只转发搜索、电影详情和海报图片请求。手机端遇到 TMDB 图片无法访问时，云函数返回海报图片数据，小程序把它写入自己的本地缓存。费用按 CloudBase 当前套餐与用量计算。
