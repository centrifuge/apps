import * as dotenv from 'dotenv'
import { Request, Response } from 'express'
import { array, date, InferType, object, string } from 'yup'
import { User, userCollection, validateAndWriteToFirestore } from '../../database'
import { HttpsError } from '../../utils/httpsError'
import { validateInput } from '../../utils/validateInput'

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
    const {
      walletAddress,
      body: { poolId, trancheId },
    } = req
    const userDoc = await userCollection.doc(walletAddress).get()
    const userData = userDoc.data() as User
    if (!userDoc.exists || !userData?.business) {
      throw new HttpsError(404, 'Business not found')
    }

    if (userData.business.steps.find(({ step, completed }) => step === 'VerifyBusiness' && !completed)) {
      throw new HttpsError(400, 'Business must be verified before confirming ownership')
    }

    if (
      !userData?.pools.find(
        (pool) => pool.poolId === poolId && pool.trancheId === trancheId && pool.investorType === 'entity'
      )
    ) {
      throw new HttpsError(400, 'Bad poolId, trancheId or investorType')
    }

    // TODO: check if email is verified: && data?.emailVerified
    if (userData.business.steps.filter((step) => step.completed).length === userData.business.steps.length) {
      throw new HttpsError(400, 'KYB already completed')
    }

    // if (!data.emailVerified) {
    //   throw new HttpsError(400, 'Email must be verified before completing business verification')
    // }

    const verifyBusiness = {
      business: {
        ultimateBeneficialOwners: req.body.ultimateBeneficialOwners,
        steps: userData.business.steps.map((step) =>
          step.step === 'ConfirmOwners' ? { ...step, completed: true } : step
        ),
      },
    }

    await validateAndWriteToFirestore(walletAddress, verifyBusiness, 'USER', [
      'business.steps',
      'business.ultimateBeneficialOwners',
    ])

    const freshUserData = (await userCollection.doc(walletAddress).get()).data()
    return res.status(200).send({ user: freshUserData })
  } catch (error) {
    if (error instanceof HttpsError) {
      console.log(error.message)
      return res.status(error.code).send(error.message)
    }
    console.log(error)
    return res.status(500).send('An unexpected error occured')
  }
}
