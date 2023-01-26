const express = require('express')
import * as dotenv from 'dotenv'
import { confirmOwnersController } from './controllers/kyb/confirmOwners'
import { verifyBusinessController } from './controllers/kyb/verifyBusiness'
import { getUserController } from './controllers/user/getUser'
import { setVerifiedIdentityController } from './controllers/user/setVerifiedIdentity'
import { startKycController } from './controllers/user/startKyc'
import { corsMiddleware } from './middleware/cors'
import { verifyJw3t } from './middleware/verifyJw3t'

dotenv.config()

const onboarding = express()

onboarding.options('*', corsMiddleware)

onboarding.use(corsMiddleware)
onboarding.use(verifyJw3t)

onboarding.get('/getUser', getUserController)

onboarding.post('/startKyc', startKycController)
onboarding.post('/setVerifiedIdentity', setVerifiedIdentityController)

onboarding.post('/verifyBusiness', verifyBusinessController)
onboarding.post('/confirmOwners', confirmOwnersController)

exports.onboarding = onboarding
