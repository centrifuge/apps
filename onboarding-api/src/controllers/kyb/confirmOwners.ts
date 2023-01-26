import { Request, Response } from 'express'
import { array, date, InferType, object, string } from 'yup'
import { OnboardingUser, userCollection, validateAndWriteToFirestore } from '../../database'
import { HttpsError } from '../../utils/httpsError'
import { validateInput } from '../../utils/validateInput'

const confirmOwnersInput = object({
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
    await validateInput(req.body, confirmOwnersInput)
    const { walletAddress } = req
    const entityDoc = await userCollection.doc(walletAddress).get()
    const entityData = entityDoc.data() as OnboardingUser
    if (!entityDoc.exists || entityData.investorType !== 'entity') {
      throw new HttpsError(404, 'Business not found')
    }

    if (!entityData.steps.verifyBusiness.completed) {
      throw new HttpsError(400, 'Business must be verified before confirming ownership')
    }

    if (entityData?.steps.confirmOwners.completed) {
      throw new HttpsError(400, 'Owners already confirmed')
    }

    // if (!data.emailVerified) {
    //   throw new HttpsError(400, 'Email must be verified before completing business verification')
    // }

    const verifyEntity = {
      ultimateBeneficialOwners: req.body.ultimateBeneficialOwners,
      steps: { ...entityData.steps, confirmOwners: { completed: true, timeStamp: new Date().toISOString() } },
    }

    await validateAndWriteToFirestore(walletAddress, verifyEntity, 'entity', ['steps', 'ultimateBeneficialOwners'])

    const freshUserData = (await userCollection.doc(walletAddress).get()).data()
    return res.status(200).send({ ...freshUserData })
  } catch (error) {
    if (error instanceof HttpsError) {
      console.log(error.message)
      return res.status(error.code).send(error.message)
    }
    console.log(error)
    return res.status(500).send('An unexpected error occured')
  }
}
