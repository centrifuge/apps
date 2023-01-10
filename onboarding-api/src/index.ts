const express = require('express')
const cors = require('cors')
import { createUserController } from './controllers/createUser'
import { confirmOwnersController } from './controllers/kyb/confirmOwners'
import { verifyBusinessController } from './controllers/kyb/verifyBusiness'

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

onboarding.post('/createUser', createUserController)
onboarding.post('/verifyBusiness', verifyBusinessController)
onboarding.post('/confirmOwners', confirmOwnersController)

exports.onboarding = onboarding
