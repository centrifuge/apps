import * as dotenv from 'dotenv'
import { getSignedAgreementController } from './controllers/agreement/getSignedAgreement'
import { getUnsignedAgreementController } from './controllers/agreement/getUnsignedAgreement'
import { sendVerifyEmailController } from './controllers/emails/sendVerifyEmail'
import { signAndSendDocumentsController } from './controllers/emails/signAndSendDocuments'
import { verifyEmailController } from './controllers/emails/verifyEmail'
import { confirmOwnersController } from './controllers/kyb/confirmOwners'
import { verifyBusinessController } from './controllers/kyb/verifyBusiness'
import { getTaxInfoController } from './controllers/user/getTaxInfo'
import { getUserController } from './controllers/user/getUser'
import { setVerifiedIdentityController } from './controllers/user/setVerifiedIdentity'
import { startKycController } from './controllers/user/startKyc'
import { updateInvestorStatusController } from './controllers/user/updateInvestorStatus'
import { uploadTaxInfoController } from './controllers/user/uploadTaxInfo'
import { verifyAccreditationController } from './controllers/user/verifyAccreditation'
import { corsMiddleware } from './middleware/cors'
import { fileUploadMiddleware } from './middleware/fileUpload'
import { rateLimiter } from './middleware/rateLimiter'
import { verifyJw3t } from './middleware/verifyJw3t'
const express = require('express')

dotenv.config()

const onboarding = express()

onboarding.use(rateLimiter)
onboarding.use(corsMiddleware)

onboarding.options('*', corsMiddleware)
onboarding.get('/getUser', verifyJw3t, getUserController)

onboarding.post('/startKyc', verifyJw3t, startKycController)
onboarding.post('/setVerifiedIdentity', verifyJw3t, setVerifiedIdentityController)

onboarding.post('/uploadTaxInfo', verifyJw3t, fileUploadMiddleware, uploadTaxInfoController)
onboarding.post('/verifyAccreditation', verifyJw3t, verifyAccreditationController)
onboarding.get('/getTaxInfo', verifyJw3t, getTaxInfoController)

onboarding.post('/verifyBusiness', verifyJw3t, verifyBusinessController)
onboarding.post('/confirmOwners', verifyJw3t, confirmOwnersController)

onboarding.get('/getUnsignedAgreement', verifyJw3t, getUnsignedAgreementController)
onboarding.get('/getSignedAgreement', verifyJw3t, getSignedAgreementController)

onboarding.post('/sendVerifyEmail', verifyJw3t, sendVerifyEmailController)
onboarding.post('/signAndSendDocuments', verifyJw3t, signAndSendDocumentsController)
onboarding.get('/verifyEmail', verifyEmailController)

onboarding.post('/updateInvestorStatus', updateInvestorStatusController)

exports.onboarding = onboarding
