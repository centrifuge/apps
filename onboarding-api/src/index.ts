const express = require('express')
import * as dotenv from 'dotenv'
import { getSignedAgreementController } from './controllers/agreement/getSignedAgreement'
import { getUnsignedAgreementController } from './controllers/agreement/getUnsignedAgreement'
import { signAgreementController } from './controllers/agreement/signAgreement'
import { confirmOwnersController } from './controllers/kyb/confirmOwners'
import { verifyBusinessController } from './controllers/kyb/verifyBusiness'
import { getUserController } from './controllers/user/getUser'
import { setVerifiedIdentityController } from './controllers/user/setVerifiedIdentity'
import { startKycController } from './controllers/user/startKyc'
import { uploadTaxInfoController } from './controllers/user/uploadTaxInfo'
import { verifyAccreditationController } from './controllers/user/verifyAccreditation'
import { corsMiddleware } from './middleware/cors'
import { verifyJw3t } from './middleware/verifyJw3t'
import fileUpload = require('express-fileupload')

dotenv.config()

const onboarding = express()

onboarding.options('*', corsMiddleware)

onboarding.use(corsMiddleware)
onboarding.use(verifyJw3t)

onboarding.get('/getUser', getUserController)

onboarding.post('/startKyc', startKycController)
onboarding.post('/setVerifiedIdentity', setVerifiedIdentityController)
onboarding.post('/uploadTaxInfo', fileUpload(), uploadTaxInfoController)
onboarding.post('/verifyAccreditation', verifyAccreditationController)

onboarding.post('/verifyBusiness', verifyBusinessController)
onboarding.post('/confirmOwners', confirmOwnersController)

onboarding.get('/getUnsignedAgreement', getUnsignedAgreementController)
onboarding.post('/signAgreement', signAgreementController)
onboarding.get('/getSignedAgreement', getSignedAgreementController)

exports.onboarding = onboarding
