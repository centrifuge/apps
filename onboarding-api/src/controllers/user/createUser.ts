import { Request, Response } from 'express'
import { InferType, object, string } from 'yup'
import { KYCSteps, User, validateAndWriteToFirestore } from '../../database'
import { HttpsError } from '../../utils/httpsError'
import { validateInput } from '../../utils/validateInput'

const createUserInput = object({
  investorType: string().oneOf(['individual', 'entity']).required(),
  poolId: string().required(),
  trancheId: string().required(),
})

export const createUserController = async (
  req: Request<any, any, InferType<typeof createUserInput>>,
  res: Response
) => {
  try {
    await validateInput(req, createUserInput)
    const { walletAddress } = req
    const { investorType, poolId, trancheId } = req.body

    const user: Partial<User> = {
      walletAddress,
      pools: [
        {
          investorType,
          poolId,
          trancheId,
        },
      ],
      steps: KYCSteps,
    }

    await validateAndWriteToFirestore(walletAddress, user, 'USER')
    return res.send({ user })
  } catch (error) {
    if (error instanceof HttpsError) {
      console.log(error.message)
      return res.status(error.code).send(error.message)
    }
    console.log(error)
    return res.status(500).send('An unexpected error occured')
  }
}
