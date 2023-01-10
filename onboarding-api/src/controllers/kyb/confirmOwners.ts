import * as cookie from 'cookie'
import * as dotenv from 'dotenv'
import { Request, Response } from 'express'
import * as jwt from 'jsonwebtoken'
import { array, date, InferType, object, string } from 'yup'
import { Business, businessCollection, validateAndWriteToFirestore } from '../../database'
import { HttpsError } from '../../utils/httpsError'
import { validateInput } from '../../utils/validateInput'
import { verifyJw3t } from '../../utils/verifyJw3t'

dotenv.config()

const confirmOwnersInput = object({
  poolId: string().required(),
  trancheId: string().required(),
  ultimateBeneficialOwners: array(
    object({
      name: string().required(),
      dateOfBirth: date().required().min(new Date(1900, 0, 1)).max(new Date()),
    }).required()
  )
    .min(1)
    .max(3),
})

export const confirmOwnersController = async (
  req: Request<any, any, InferType<typeof confirmOwnersInput>>,
  res: Response
) => {
  try {
    await validateInput(req, confirmOwnersInput)
    const { address } = await verifyJw3t(req)

    const cookies = cookie.parse(req.headers.cookie ?? '').__session
    const confirmationToken = jwt.verify(cookies, process.env.JWT_SECRET as string) as { address: string }
    if (address !== confirmationToken.address) {
      throw new HttpsError(400, 'Confirmation not possible.')
    }
    const businessId = `${address}-${req.body.poolId}`
    const businessDoc = await businessCollection.doc(businessId).get()
    const data = businessDoc.data() as Business
    if (!businessDoc.exists || !data) {
      throw new HttpsError(404, 'Business not found')
    }
    if (businessDoc.exists && data?.kybCompleted) {
      throw new HttpsError(400, 'Business verification step already confirmed')
    }

    const verifyBusiness = {
      kybCompleted: true,
      ultimateBeneficialOwners: req.body.ultimateBeneficialOwners,
    }

    await validateAndWriteToFirestore(`${address}-${req.body.poolId}`, verifyBusiness, 'BUSINESS', [
      'kybCompleted',
      'ultimateBeneficialOwners',
    ])

    res.clearCookie('__session')
    const freshData = (await businessCollection.doc(`${address}-${req.body.poolId}`).get()).data()
    return res.status(200).send({ data: freshData })
  } catch (error) {
    if (error instanceof HttpsError) {
      console.log(error.message)
      return res.status(error.code).send(error.message)
    }
    console.log(error)
    return res.status(500).send('An unexpected error occured')
  }
}
