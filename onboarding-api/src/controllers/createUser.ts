import { Request, Response } from 'express'
import { InferType, object, string } from 'yup'
import { User, validateAndWriteToFirestore } from '../database'
import { validateInput } from '../utils/validateInput'
import { verifyJw3t } from '../utils/verifyJw3t'

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
  const { address } = await verifyJw3t(req)
  await validateInput(req, createUserInput)

  const { investorType, poolId, trancheId } = req.body

  const user: Partial<User> = {
    walletAddress: address,
    pools: [
      {
        investorType,
        poolId,
        trancheId,
      },
    ],
    kycCompleted: false,
  }

  if (investorType === 'entity') {
    const businessId = `${address}-${poolId}`
    const business = {
      walletAddress: address,
      kybCompleted: false,
    }
    user.businessId = businessId
    await validateAndWriteToFirestore(businessId, business, 'BUSINESS')
  }

  await validateAndWriteToFirestore(address, user, 'USER')
  return res.send(user)
}
