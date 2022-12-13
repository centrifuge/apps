import * as cookie from 'cookie'
import { Request, Response } from 'express'
import * as functions from 'firebase-functions'
import { HttpsError } from 'firebase-functions/v1/auth'
import { businessCollection, BusinessOnboarding, validateAndWriteToFirestore } from '../database'
import { checkHttpMethod } from '../utils/httpMethods'
import { verifyJw3t } from '../utils/verifyJw3t'

export const businessVerificationConfirmController = async (req: Request, res: Response) => {
  try {
    checkHttpMethod(req, 'GET')
    const { address } = await verifyJw3t(req)

    const cookies = JSON.parse(cookie.parse(req.headers.cookie ?? '').__session)
    if (address !== cookies.address) {
      throw new HttpsError('invalid-argument', 'Confirmation not possible. Either AML or KYB failed.')
    }
    const businessDoc = await businessCollection.doc(address).get()
    const data = businessDoc.data() as BusinessOnboarding
    if (!businessDoc.exists || !data) {
      throw new HttpsError('not-found', 'Business not found')
    }
    if (businessDoc.exists && data?.steps.kyb.verified) {
      throw new HttpsError('invalid-argument', 'Business verification step already confirmed')
    }

    const verifyBusiness = {
      steps: {
        kyb: {
          verified: true,
        },
      },
    }

    await validateAndWriteToFirestore(address, verifyBusiness, 'BUSINESS', 'steps.kyb.verified')

    res.clearCookie('__session')
    const freshData = (await businessCollection.doc(address).get()).data()
    res.status(201).send({ data: freshData })
  } catch (error) {
    if (error instanceof HttpsError) {
      functions.logger.log(error.message)
      res.status(error.httpErrorCode.status).send(error.message)
    } else {
      functions.logger.log(error)
      res.status(500).send('An unexpected error occured')
    }
  }
}
