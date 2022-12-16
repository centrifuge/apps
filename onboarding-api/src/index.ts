import * as functions from 'firebase-functions'
import { businessVerificationController } from './controllers/businessVerification'
import { businessVerificationConfirmController } from './controllers/businessVerificationConfirm'

// @ts-expect-error not sure
exports.businessVerification = functions.https.onRequest(businessVerificationController)
// @ts-expect-error not sure
exports.businessVerificationConfirm = functions.https.onRequest(businessVerificationConfirmController)
