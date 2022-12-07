import * as functions from 'firebase-functions'
import { businessVerificationController } from './controllers/business-verification'
import { businessVerificationConfirmController } from './controllers/business-verification-confirm'

exports.businessVerification = functions.https.onRequest(businessVerificationController)
exports.businessVerificationConfirm = functions.https.onRequest(businessVerificationConfirmController)
