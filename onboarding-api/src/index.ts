const cookieParser = require('cookie-parser')
import * as dotenv from 'dotenv'
import { getSignedAgreementController } from './controllers/agreement/getSignedAgreement'
import { getUnsignedAgreementController } from './controllers/agreement/getUnsignedAgreement'
import { authenticateWalletController } from './controllers/auth/authenticateWallet'
import { generateNonceController } from './controllers/auth/generateNonce'
import { verifyTokenController } from './controllers/auth/verifyToken'
import { sendVerifyEmailController } from './controllers/emails/sendVerifyEmail'
import { signAndSendDocumentsController } from './controllers/emails/signAndSendDocuments'
import { verifyEmailController } from './controllers/emails/verifyEmail'
import { KYBCallbackController } from './controllers/kyb/callback'
import { confirmOwnersController } from './controllers/kyb/confirmOwners'
import { startKYBController } from './controllers/kyb/startKYB'
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
import { verifyAuth } from './middleware/verifyAuth'
const express = require('express')

dotenv.config()

const onboarding = express()

onboarding.use(rateLimiter)
onboarding.use(corsMiddleware)
onboarding.use(cookieParser(process.env.COOKIE_SECRET))

onboarding.options('*', corsMiddleware)
onboarding.post('/authenticateWallet', authenticateWalletController)
onboarding.post('/verify', verifyTokenController)
onboarding.post('/nonce', generateNonceController)

onboarding.post('/sendVerifyEmail', verifyAuth, sendVerifyEmailController)
onboarding.get('/verifyEmail', verifyEmailController)

onboarding.get('/getUser', verifyAuth, getUserController)

onboarding.post('/startKyc', verifyAuth, startKycController)
onboarding.post('/setVerifiedIdentity', verifyAuth, setVerifiedIdentityController)

onboarding.post('/startKyb', verifyAuth, startKYBController)
onboarding.post('/kyb-callback', KYBCallbackController)
onboarding.get('/kyb-callback', KYBCallbackController)

onboarding.post('/uploadTaxInfo', verifyAuth, fileUploadMiddleware, uploadTaxInfoController)
onboarding.post('/verifyAccreditation', verifyAuth, verifyAccreditationController)
onboarding.get('/getTaxInfo', verifyAuth, getTaxInfoController)

onboarding.post('/verifyBusiness', verifyAuth, verifyBusinessController)
onboarding.post('/confirmOwners', verifyAuth, confirmOwnersController)

onboarding.get('/getUnsignedAgreement', verifyAuth, getUnsignedAgreementController)
onboarding.get('/getSignedAgreement', verifyAuth, getSignedAgreementController)
onboarding.post('/signAndSendDocuments', verifyAuth, signAndSendDocumentsController)

onboarding.post('/updateInvestorStatus', updateInvestorStatusController)

exports.onboarding = onboarding
