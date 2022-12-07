import { Request, Response } from 'express'
import * as functions from 'firebase-functions'
import { HttpsError } from 'firebase-functions/v1/auth'
import { object, string } from 'yup'
import { businessCollection, BusinessOnboarding } from '../database'
import { verifyJw3t } from '../utils/verifyJw3t'

const businessVerificationConfirmParams = object({
  verificationCode: string().length(27).required(),
})

export const businessVerificationConfirmController = async (req: Request, res: Response) => {
  try {
    if (req.method !== 'GET') {
      throw new HttpsError('permission-denied', 'Method not allowed')
    }
    const { address } = await verifyJw3t(req)
    await businessVerificationConfirmParams.validate(req.query)

    const verificationCode = req.params.code
    if (!verificationCode) {
      throw new HttpsError('invalid-argument', 'Verification code missing')
    }

    const businessDoc = await businessCollection.doc(address).get()
    if (businessDoc.exists && businessDoc.data()?.steps.businessVerification.verified) {
      throw new Error('businessVerification step already confirmed')
    }

    const data = businessDoc.data() as BusinessOnboarding
    if (!businessDoc.exists || !data) {
      throw new HttpsError('not-found', 'Business not found')
    }

    if (!data.steps.kyb.verificationCode) {
      throw new HttpsError('permission-denied', 'businessVerification must be submitted before confirming')
    }

    if (data.steps.kyb.verificationCode !== verificationCode) {
      throw new HttpsError('permission-denied', 'Invalid verification code')
    }

    await businessCollection.doc(address).set({
      'steps.kyb.verified': true,
    })

    res.status(201)
  } catch (error) {
    if (error instanceof HttpsError) {
      functions.logger.log(error.message)
      res.status(error.httpErrorCode.status).send(error.message)
    } else {
      res.status(500).send('An unexpected error occured')
    }
  }
}
