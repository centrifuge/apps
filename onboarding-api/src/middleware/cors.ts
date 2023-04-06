const cors = require('cors')

const centrifugeDomains = [
  /^(https:\/\/.*cntrfg\.com)/,
  /^(https:\/\/.*centrifuge\.io)/,
  /^(https:\/\/.*altair\.network)/,
  /^(https:\/\/.*k-f\.dev)/,
]

export const corsMiddleware = cors({
  origin: (origin, callback) => {
    console.log('<< origin in cors', origin)
    const isLocalhost = /^(http:\/\/localhost:)./.test(origin)
    const isCentrifugeDomain = centrifugeDomains.some((regex) => regex.test(origin))
    const isShuftiDomain = /^https:\/\/app\.shuftipro\.com/.test(origin)

    if (isLocalhost || isCentrifugeDomain || isShuftiDomain || origin === undefined) {
      callback(null, true)
    } else {
      callback(new Error(`Not allowed by CORS, ${origin}`))
    }
  },
  credentials: true,
})
