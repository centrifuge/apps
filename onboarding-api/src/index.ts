const express = require('express')
const cors = require('cors')
import { businessVerificationController } from './controllers/businessVerification'
import { businessVerificationConfirmController } from './controllers/businessVerificationConfirm'

const centrifugeDomains = [
  /^(https:\/\/.*cntrfg\.com)/,
  /^(https:\/\/.*centrifuge\.io)/,
  /^(https:\/\/.*altair\.network)/,
  /^(https:\/\/pr-\d*--dev-app-cntrfg.netlify\.app)/,
]

const onboarding = express()
onboarding.use(
  cors({
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
)

onboarding.post('/businessVerification', businessVerificationController)
onboarding.post('/businessVerificationConfirm', businessVerificationConfirmController)

exports.onboarding = onboarding
