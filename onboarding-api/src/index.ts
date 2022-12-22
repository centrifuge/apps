import * as functions from 'firebase-functions'
import { businessVerificationController } from './controllers/businessVerification'
import { businessVerificationConfirmController } from './controllers/businessVerificationConfirm'

const allowedDomains = ['http://localhost:3000']

const cors = require('cors')({
  origin: (origin, callback) => {
    const allowed = allowedDomains.includes(origin)
    if (allowed) {
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
