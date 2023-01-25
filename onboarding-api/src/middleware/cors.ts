const cors = require('cors')

const centrifugeDomains = [
  /^(https:\/\/.*cntrfg\.com)/,
  /^(https:\/\/.*centrifuge\.io)/,
  /^(https:\/\/.*altair\.network)/,
  /^(https:\/\/pr-\d*--dev-app-cntrfg.netlify\.app)/,
]

export const corsMiddleware = cors({
  origin: (origin, callback) => {
    const isLocalhost = /^(http:\/\/localhost:)./.test(origin)
    const isCentrifugeDomain = centrifugeDomains.some((regex) => regex.test(origin))

    if (isLocalhost || isCentrifugeDomain) {
      callback(null, true)
    } else {
      callback(new Error('Not allowed by CORS'))
    }
  },
  credentials: true,
})
