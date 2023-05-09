const cors = require('cors')

const allowedOrigins = [
  /^(https:\/\/.*cntrfg\.com)$/,
  /^(https:\/\/.*centrifuge\.io)$/,
  /^(https:\/\/.*altair\.network)$/,
  /^(https:\/\/.*k-f\.dev)$/,
  /^(https:\/\/shuftipro\.com)$/,
  /^(http:\/\/localhost:)\d{1,5}$/,
]

export const corsMiddleware = cors({
  origin: (origin, callback) => {
    const isAllowedOrigin = allowedOrigins.some((regex) => regex.test(origin))

    if (isAllowedOrigin) {
      callback(null, true)
    } else {
      callback(new Error(`Not allowed by CORS, ${origin}`))
    }
  },
  credentials: true,
})
