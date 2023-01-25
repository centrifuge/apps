const express = require('express')
import * as dotenv from 'dotenv'
import { confirmOwnersController } from './controllers/kyb/confirmOwners'
import { verifyBusinessController } from './controllers/kyb/verifyBusiness'
import { getUserController } from './controllers/user/getUser'
import { kycStatusController } from './controllers/user/kycStatus'
import { verifyIdentityController } from './controllers/user/verifyIdentity'
import { corsMiddleware } from './middleware/cors'
import { verifyJw3t } from './middleware/verifyJw3t'

dotenv.config()

const onboarding = express()

onboarding.options('*', corsMiddleware)

onboarding.use(corsMiddleware)
onboarding.use(verifyJw3t)

onboarding.get('/getUser', getUserController)
onboarding.get('/kycStatus', kycStatusController)

onboarding.post('/verifyIdentity', verifyIdentityController)
onboarding.post('/kyc', verifyIdentityController)

onboarding.post('/verifyBusiness', verifyBusinessController)
onboarding.post('/confirmOwners', confirmOwnersController)

exports.onboarding = onboarding
