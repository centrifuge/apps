const express = require('express')
import * as dotenv from 'dotenv'
import { confirmOwnersController } from './controllers/kyb/confirmOwners'
import { verifyBusinessController } from './controllers/kyb/verifyBusiness'
import { getUserController } from './controllers/user/getUser'
import { corsMiddleware } from './middleware/cors'
import { verifyJw3t } from './middleware/verifyJw3t'

dotenv.config()

const onboarding = express()
onboarding.use(corsMiddleware)
onboarding.use(verifyJw3t)

onboarding.get('/getUser', getUserController)

onboarding.post('/verifyBusiness', verifyBusinessController)
onboarding.post('/confirmOwners', confirmOwnersController)

exports.onboarding = onboarding
