const express = require('express')
import { confirmOwnersController } from './controllers/kyb/confirmOwners'
import { getBusinessController } from './controllers/kyb/getBusiness'
import { verifyBusinessController } from './controllers/kyb/verifyBusiness'
import { createUserController } from './controllers/user/createUser'
import { getUserController } from './controllers/user/getUser'
import { corsMiddleware } from './middleware/cors'
import { verifyJw3t } from './middleware/verifyJw3t'

const onboarding = express()
onboarding.use(corsMiddleware)
onboarding.use(verifyJw3t)

onboarding.post('/createUser', createUserController)
onboarding.post('/getUser', getUserController)

onboarding.post('/verifyBusiness', verifyBusinessController)
onboarding.post('/confirmOwners', confirmOwnersController)
onboarding.post('/getBusiness', getBusinessController)

exports.onboarding = onboarding
