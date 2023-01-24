import { Request, Response } from 'express'
import { InferType, object, string } from 'yup'
import { OnboardingUser, userCollection, validateAndWriteToFirestore, writeToOnboardingBucket } from '../../database'
import { HttpsError } from '../../utils/httpsError'
import { Subset } from '../../utils/types'
import { validateInput } from '../../utils/validateInput'

const uploadTaxInfoInput = object({
  poolId: string().required(),
  trancheId: string().required(),
})

export const uploadTaxInfoController = async (
  req: Request<{}, {}, Buffer, InferType<typeof uploadTaxInfoInput>>,
  res: Response
) => {
  try {
    await validateInput(req.query, uploadTaxInfoInput)

    const { poolId, trancheId } = req.query

    const walletAddress = req.walletAddress

    const user = (await userCollection.doc(req.walletAddress).get())?.data()

    await writeToOnboardingBucket(
      Uint8Array.from(req.body),
      `tax-information/${walletAddress}/${poolId}/${trancheId}.pdf`
    )

    if (user) {
      const updatedUser: Subset<OnboardingUser> = {
        steps: {
          ...user.steps,
          verifyTaxInfo: {
            completed: true,
            timeStamp: new Date().toISOString(),
          },
        },
      }

      await validateAndWriteToFirestore(walletAddress, updatedUser, 'entity', ['steps'])

      const freshUserData = (await userCollection.doc(walletAddress).get()).data()
      return res.status(200).send({ ...freshUserData })
    }

    throw new Error()
  } catch (error) {
    if (error instanceof HttpsError) {
      console.log(error.message)
      return res.status(error.code).send(error.message)
    }
    console.log(error)
    return res.status(500).send('An unexpected error occured')
  }
}
