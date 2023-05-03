const cors = require('cors')

const centrifugeDomains = [
  /^(https:\/\/.*cntrfg\.com)$/,
  /^(https:\/\/.*centrifuge\.io)$/,
  /^(https:\/\/.*altair\.network)$/,
  /^(https:\/\/.*k-f\.dev)$/,
]

export const corsMiddleware = cors({
  origin: (origin, callback) => {
    const isLocalhost = /^(http:\/\/localhost:)\d{1,5}$/.test(origin)
    const isCentrifugeDomain = centrifugeDomains.some((regex) => regex.test(origin))

    if (isLocalhost || isCentrifugeDomain) {
      callback(null, true)
    } else {
      callback(new Error(`Not allowed by CORS, ${origin}`))
    }
  },
  credentials: true,
})
