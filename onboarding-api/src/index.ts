const express = require('express')
import * as dotenv from 'dotenv'
import { getSignedAgreementController } from './controllers/agreement/getSignedAgreement'
import { getUnsignedAgreementController } from './controllers/agreement/getUnsignedAgreement'
import { signAgreementController } from './controllers/agreement/signAgreement'
import { sendVerifyEmailController } from './controllers/emails/sendVerifyEmail'
import { verifyEmailController } from './controllers/emails/verifyEmail'
import { confirmOwnersController } from './controllers/kyb/confirmOwners'
import { verifyBusinessController } from './controllers/kyb/verifyBusiness'
import { getTaxInfoController } from './controllers/user/getTaxInfo'
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

onboarding.get('/getUser', verifyJw3t, getUserController)

onboarding.post('/startKyc', verifyJw3t, startKycController)
onboarding.post('/setVerifiedIdentity',verifyJw3t, setVerifiedIdentityController)

onboarding.post('/uploadTaxInfo', verifyJw3t, fileUpload(), uploadTaxInfoController)
onboarding.post('/verifyAccreditation', verifyJw3t, verifyAccreditationController)
onboarding.get('/getTaxInfo',verifyJw3t, getTaxInfoController)

onboarding.post('/verifyBusiness', verifyJw3t, verifyBusinessController)
onboarding.post('/confirmOwners', verifyJw3t, confirmOwnersController)

onboarding.get('/getUnsignedAgreement', verifyJw3t, getUnsignedAgreementController)
onboarding.post('/signAgreement', verifyJw3t, signAgreementController)
onboarding.get('/getSignedAgreement', verifyJw3t, getSignedAgreementController)

onboarding.post('/sendVerifyEmail', verifyJw3t, sendVerifyEmailController)
onboarding.get('/verifyEmail', verifyEmailController)

exports.onboarding = onboarding
