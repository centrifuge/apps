const cookieParser = require('cookie-parser')
import * as dotenv from 'dotenv'
import express, { Express } from 'express'
import { getSignedAgreementController } from './controllers/agreement/getSignedAgreement'
import { authenticateWalletController } from './controllers/auth/authenticateWallet'
import { generateNonceController } from './controllers/auth/generateNonce'
import { verifyTokenController } from './controllers/auth/verifyToken'
import { sendVerifyEmailController } from './controllers/emails/sendVerifyEmail'
import { signAndSendDocumentsController } from './controllers/emails/signAndSendDocuments'
import { verifyEmailController } from './controllers/emails/verifyEmail'
import { confirmOwnersController } from './controllers/kyb/confirmOwners'
import { manualKybCallbackController } from './controllers/kyb/manualKybCallback'
import { verifyBusinessController } from './controllers/kyb/verifyBusiness'
import { getGlobalOnboardingStatusController } from './controllers/user/getGlobalOnboardingStatus'
import { getTaxInfoController } from './controllers/user/getTaxInfo'
import { getUserController } from './controllers/user/getUser'
import { setVerifiedIdentityController } from './controllers/user/setVerifiedIdentity'
import { startKycController } from './controllers/user/startKyc'
import { updateInvestorStatusController } from './controllers/user/updateInvestorStatus'
import { uploadTaxInfoController } from './controllers/user/uploadTaxInfo'
import { verifyAccreditationController } from './controllers/user/verifyAccreditation'
import { corsMiddleware } from './middleware/cors'
import { fileUpload } from './middleware/fileUpload'
import { rateLimiter } from './middleware/rateLimiter'
import { shuftiProAuthMiddleware } from './middleware/shuftiProAuthMiddleware'
import { verifyAuth } from './middleware/verifyAuth'

dotenv.config()

const onboarding = express() as Express

onboarding.use(rateLimiter)
onboarding.use(shuftiProAuthMiddleware)
onboarding.use(corsMiddleware)
onboarding.use(cookieParser(process.env.COOKIE_SECRET))
onboarding.disable('x-powered-by')
onboarding.disable('server')

onboarding.options('*', corsMiddleware)

onboarding.get('/getGlobalOnboardingStatus', getGlobalOnboardingStatusController)
onboarding.get('/getSignedAgreement', verifyAuth, getSignedAgreementController)
onboarding.get('/getTaxInfo', verifyAuth, getTaxInfoController)
onboarding.get('/getUser', verifyAuth, getUserController)
onboarding.get('/verifyEmail', verifyEmailController)

onboarding.post('/authenticateWallet', authenticateWalletController)
onboarding.post('/confirmOwners', verifyAuth, confirmOwnersController)
onboarding.post('/manualKybCallback', manualKybCallbackController)
onboarding.post('/nonce', generateNonceController)
onboarding.post('/sendVerifyEmail', verifyAuth, sendVerifyEmailController)
onboarding.post('/setVerifiedIdentity', verifyAuth, setVerifiedIdentityController)
onboarding.post('/signAndSendDocuments', verifyAuth, signAndSendDocumentsController)
onboarding.post('/startKyc', verifyAuth, startKycController)
onboarding.post('/updateInvestorStatus', updateInvestorStatusController)
onboarding.post('/uploadTaxInfo', verifyAuth, fileUpload, uploadTaxInfoController)
onboarding.post('/verify', verifyTokenController)
onboarding.post('/verifyAccreditation', verifyAuth, verifyAccreditationController)
onboarding.post('/verifyBusiness', verifyAuth, verifyBusinessController)

exports.onboarding = onboarding
