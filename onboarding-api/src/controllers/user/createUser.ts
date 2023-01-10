import { Request, Response } from 'express'
import { InferType, object, string } from 'yup'
import { Business, KYBSteps, KYCSteps, User, validateAndWriteToFirestore } from '../../database'
import { HttpsError } from '../../utils/httpsError'
import { validateInput } from '../../utils/validateInput'

const createUserInput = object({
  investorType: string().oneOf(['individual', 'entity']).required(),
  poolId: string().required(),
  trancheId: string().required(),
})

/**
 * Step 1
 */
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
      steps: KYCSteps.map((step) => (step.step === 'InvestorType' ? { ...step, completed: true } : step)),
    }

    let business: undefined | Partial<Business> = undefined
    if (investorType === 'entity') {
      business = {
        walletAddress,
        steps: KYBSteps,
      }
      await validateAndWriteToFirestore(walletAddress, business, 'BUSINESS')
    }

    await validateAndWriteToFirestore(walletAddress, user, 'USER')
    return res.send({ user, ...(business ? business : {}) })
  } catch (error) {
    if (error instanceof HttpsError) {
      console.log(error.message)
      return res.status(error.code).send(error.message)
    }
    console.log(error)
    return res.status(500).send('An unexpected error occured')
  }
}
