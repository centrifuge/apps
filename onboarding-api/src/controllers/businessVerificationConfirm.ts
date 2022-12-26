import * as cookie from 'cookie'
import { Request, Response } from 'express'
import * as functions from 'firebase-functions'
import { HttpsError } from 'firebase-functions/v1/https'
import * as jwt from 'jsonwebtoken'
import { array, InferType, object, string } from 'yup'
import { businessCollection, BusinessOnboarding, validateAndWriteToFirestore } from '../database'
import { checkHttpMethod } from '../utils/httpMethods'
import { validateInput } from '../utils/validateInput'
import { verifyJw3t } from '../utils/verifyJw3t'

const businessVerificationConfirmInput = object({
  ultimateBeneficialOwners: array(
    object({
      name: string().required(),
    })
  ).required(),
})

export const businessVerificationConfirmController = async (
  req: Request<any, any, InferType<typeof businessVerificationConfirmInput>>,
  res: Response
) => {
  try {
    checkHttpMethod(req, 'POST')
    const { address } = await verifyJw3t(req)
    await validateInput(req, businessVerificationConfirmInput)

    const cookies = cookie.parse(req.headers.cookie ?? '').__session
    const confirmationToken = jwt.verify(cookies, process.env.JWT_SECRET as string) as { address: string }
    if (address !== confirmationToken.address) {
      throw new HttpsError('invalid-argument', 'Confirmation not possible.')
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
      ultimateBeneficialOwners: req.body.ultimateBeneficialOwners,
    }

    await validateAndWriteToFirestore(address, verifyBusiness, 'BUSINESS', [
      'steps.kyb.verified',
      'ultimateBeneficialOwners',
    ])

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
