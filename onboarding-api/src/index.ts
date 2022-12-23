import * as functions from 'firebase-functions'
import { businessVerificationController } from './controllers/businessVerification'
import { businessVerificationConfirmController } from './controllers/businessVerificationConfirm'

exports.businessVerification = functions.https.onRequest(businessVerificationController)
exports.businessVerificationConfirm = functions.https.onRequest(businessVerificationConfirmController)
