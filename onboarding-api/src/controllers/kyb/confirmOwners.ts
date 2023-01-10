import * as dotenv from 'dotenv'
import { Request, Response } from 'express'
import { array, date, InferType, object, string } from 'yup'
import { Business, businessCollection, User, userCollection, validateAndWriteToFirestore } from '../../database'
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
    if (!userDoc.exists) {
      throw new HttpsError(400, 'User must be created before verifying business (/createUser)')
    }

    const userData = userDoc.data() as User
    if (
      !userData?.pools.find(
        (pool) => pool.poolId === poolId && pool.trancheId === trancheId && pool.investorType === 'entity'
      )
    ) {
      throw new HttpsError(400, 'Verify business is only available for investorType "entity"')
    }

    const businessDoc = await businessCollection.doc(walletAddress).get()
    const data = businessDoc.data() as Business
    if (!businessDoc.exists || !data) {
      throw new HttpsError(404, 'Business not found')
    }

    // TODO: check if email is verified: && data?.emailVerified
    if (businessDoc.exists && data?.kybCompleted) {
      throw new HttpsError(400, 'Business verification step already confirmed')
    }

    // if (!data.emailVerified) {
    //   throw new HttpsError(400, 'Email must be verified before completing business verification')
    // }

    const verifyBusiness = {
      ultimateBeneficialOwners: req.body.ultimateBeneficialOwners,
      steps: (businessDoc?.data() as Business).steps.map((step) =>
        step.step === 'ConfirmOwners' ? { ...step, completed: true } : step
      ),
    }

    await validateAndWriteToFirestore(walletAddress, verifyBusiness, 'BUSINESS', ['ultimateBeneficialOwners', 'steps'])

    const freshBusinessData = (await businessCollection.doc(walletAddress).get()).data()
    const freshUserData = (await userCollection.doc(walletAddress).get()).data()
    return res.status(200).send({ user: freshUserData, business: freshBusinessData })
  } catch (error) {
    if (error instanceof HttpsError) {
      console.log(error.message)
      return res.status(error.code).send(error.message)
    }
    console.log(error)
    return res.status(500).send('An unexpected error occured')
  }
}
