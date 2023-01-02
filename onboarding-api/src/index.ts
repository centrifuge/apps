import * as functions from 'firebase-functions'
import { businessVerificationController } from './controllers/businessVerification'
import { businessVerificationConfirmController } from './controllers/businessVerificationConfirm'

const centrifugeDomains = [
  /^(https:\/\/.*cntrfg\.com)/,
  /^(https:\/\/.*centrifuge\.io)/,
  /^(https:\/\/.*altair\.network)/,
]

const cors = require('cors')({
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

exports.businessVerification = functions.https.onRequest((request, response) =>
  cors(request, response, () => businessVerificationController(request, response))
)
exports.businessVerificationConfirm = functions.https.onRequest((request, response) =>
  cors(request, response, () => businessVerificationConfirmController(request, response))
)
