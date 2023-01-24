import { Request, Response } from 'express'
import { OnboardingUser, userCollection, validateAndWriteToFirestore } from '../../database'
import { HttpsError } from '../../utils/httpsError'
import { Subset } from '../../utils/types'

export const verifyAccreditationController = async (req: Request, res: Response) => {
  try {
    const userDoc = await userCollection.doc(req.walletAddress).get()
    const user = userDoc.data() as OnboardingUser

    if (!user || user.steps.verifyAccreditation.completed) {
      throw new HttpsError(400, 'Unable to process request')
    }

    if (user.investorType === 'entity' && user.jurisdictionCode !== 'us') {
      throw new HttpsError(400, 'Only US entities need to verify their accreditation status')
    }

    if (user.investorType === 'individual' && user.countryOfCitizenship !== 'us') {
      throw new HttpsError(400, 'Only US individuals need to verify their accreditation status')
    }

    const updatedUser: Subset<OnboardingUser> = {
      steps: {
        ...user.steps,
        verifyAccreditation: {
          completed: true,
          timeStamp: new Date().toISOString(),
        },
      },
    }
    await validateAndWriteToFirestore(user.wallet.address, updatedUser, 'entity', ['steps'])
    const freshUserData = (await userCollection.doc(user.wallet.address).get()).data()
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
