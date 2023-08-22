const cookieParser = require('cookie-parser')
import * as dotenv from 'dotenv'
import express, { Express } from 'express'
import { getBalanceForSigningController } from './controllers/agreement/getBalanceForSigning'
import { getSignedAgreementController } from './controllers/agreement/getSignedAgreement'
import { authenticateWalletController } from './controllers/auth/authenticateWallet'
import { generateNonceController } from './controllers/auth/generateNonce'
import { verifyTokenController } from './controllers/auth/verifyToken'
import { sendVerifyEmailController } from './controllers/emails/sendVerifyEmail'
import { signAndSendDocumentsController } from './controllers/emails/signAndSendDocuments'
import { verifyEmailController } from './controllers/emails/verifyEmail'
import { initProxiesController } from './controllers/init/initProxies'
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
import { canOnboardToTinlakeTranche } from './middleware/canOnboardToTinlakeTranche'
import { corsMiddleware } from './middleware/cors'
import { fileUpload } from './middleware/fileUpload'
import { rateLimiterMiddleware } from './middleware/rateLimiter'
import { shuftiProAuthMiddleware } from './middleware/shuftiProAuthMiddleware'
import { verifyAuth } from './middleware/verifyAuth'

dotenv.config()

const onboarding = express() as Express
onboarding.disable('x-powered-by')
onboarding.disable('server')
onboarding.options('*', corsMiddleware)

// global middleware
onboarding.use(rateLimiterMiddleware)
onboarding.use(shuftiProAuthMiddleware)
onboarding.use(corsMiddleware)
onboarding.use(cookieParser(process.env.COOKIE_SECRET))

// auth
onboarding.post('/nonce', generateNonceController)
onboarding.post('/authenticateWallet', authenticateWalletController)
onboarding.post('/verify', verifyTokenController)

// email verification
onboarding.get('/verifyEmail', verifyEmailController)
onboarding.post('/sendVerifyEmail', verifyAuth, sendVerifyEmailController)

// global steps
onboarding.post('/verifyBusiness', verifyAuth, verifyBusinessController)
onboarding.post('/manualKybCallback', manualKybCallbackController)
onboarding.post('/confirmOwners', verifyAuth, confirmOwnersController)
onboarding.post('/verifyAccreditation', verifyAuth, verifyAccreditationController)
onboarding.post('/startKyc', verifyAuth, startKycController)
onboarding.post('/setVerifiedIdentity', verifyAuth, setVerifiedIdentityController)
onboarding.post('/uploadTaxInfo', verifyAuth, fileUpload, uploadTaxInfoController)

// pool steps
onboarding.post('/signAndSendDocuments', verifyAuth, canOnboardToTinlakeTranche, signAndSendDocumentsController)
onboarding.post('/updateInvestorStatus', updateInvestorStatusController)

// getters
onboarding.get('/getUser', verifyAuth, getUserController)
onboarding.get('/getGlobalOnboardingStatus', getGlobalOnboardingStatusController)
onboarding.post('/getBalanceForSigning', verifyAuth, getBalanceForSigningController)
onboarding.get('/getSignedAgreement', verifyAuth, getSignedAgreementController)
onboarding.get('/getTaxInfo', verifyAuth, getTaxInfoController)

// init
onboarding.get('/initProxies', initProxiesController)

exports.onboarding = onboarding
