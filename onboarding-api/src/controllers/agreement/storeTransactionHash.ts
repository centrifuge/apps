import { Request, Response } from 'express'
import { InferType, object, string } from 'yup'
import { OnboardingUser, userCollection, validateAndWriteToFirestore } from '../../database'
import { fetchUser } from '../../utils/fetchUser'
import { HttpsError } from '../../utils/httpsError'
import { Subset } from '../../utils/types'
import { validateInput } from '../../utils/validateInput'

const storeTransactionHashInput = object({
  poolId: string().required(),
  trancheId: string().required(),
  transactionHash: string().required(),
})

export const storeTransactionHashController = async (
  req: Request<any, any, InferType<typeof storeTransactionHashInput>>,
  res: Response
) => {
  try {
    await validateInput(req.body, storeTransactionHashInput)
    const { poolId, trancheId, transactionHash } = req.body
    const { walletAddress } = req

    const user = await fetchUser(walletAddress)

    if (!user?.steps.signAgreements[poolId]?.[trancheId]?.signedDocument) {
      throw new HttpsError(400, 'User must sign document before posting transaction hash')
    }

    const updatedUser: Subset<OnboardingUser> = {
      steps: {
        ...user.steps,
        signAgreements: {
          ...user.steps.signAgreements,
          [poolId]: {
            ...user.steps.signAgreements[poolId],
            [trancheId]: {
              ...user.steps.signAgreements[poolId][trancheId],
              transactionHash,
            },
          },
        },
      },
    }

    await validateAndWriteToFirestore(walletAddress, updatedUser, 'entity', ['steps'])

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
