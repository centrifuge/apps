import { Request, Response } from 'express'
import { InferType, object, string, StringSchema } from 'yup'
import { OnboardingUser, validateAndWriteToFirestore } from '../../database'
import { sendApproveInvestorMessage } from '../../emails/sendApproveInvestorMessage'
import { UpdateInvestorStatusPayload } from '../../emails/sendDocumentsToIssuer'
import { sendRejectInvestorMessage } from '../../emails/sendRejectInvestorMessage'
import { whitelistInvestor } from '../../utils/centrifuge'
import { fetchUser } from '../../utils/fetchUser'
import { HttpsError } from '../../utils/httpsError'
import { Subset } from '../../utils/types'
import { validateInput } from '../../utils/validateInput'
import { verifyJwt } from '../../utils/verifyJwt'

const updateInvestorStatusParams = object({
  token: string().required(),
  status: string().oneOf(['approved', 'rejected']).required() as StringSchema<'approved' | 'rejected'>,
})

export const updateInvestorStatusController = async (
  req: Request<any, any, any, InferType<typeof updateInvestorStatusParams>>,
  res: Response
) => {
  try {
    await validateInput(req.query, updateInvestorStatusParams)
    const {
      query: { token, status },
    } = req
    const payload = verifyJwt<UpdateInvestorStatusPayload>(token)
    const { poolId, trancheId, walletAddress } = payload
    const user = await fetchUser(walletAddress)

    if (user.onboardingStatus[poolId][trancheId].status !== 'pending') {
      throw new HttpsError(400, 'Investor status may have already been updated')
    }

    const updatedUser: Subset<OnboardingUser> = {
      onboardingStatus: {
        [poolId]: {
          [trancheId]: {
            status,
            timeStamp: new Date().toISOString(),
          },
        },
      },
    }

    await validateAndWriteToFirestore(walletAddress, updatedUser, 'entity', ['onboardingStatus'])

    if (user?.email && status === 'approved') {
      await sendApproveInvestorMessage(user.email, poolId, trancheId)
      await whitelistInvestor(walletAddress, poolId, trancheId)
    } else if (user?.email && status === 'rejected') {
      await sendRejectInvestorMessage(user.email, poolId)
    }
    return res.status(204).send()
  } catch (error) {
    if (error instanceof HttpsError) {
      console.log(error.message)
      return res.status(error.code).send(error.message)
    }
    console.log(error)
    return res.status(500).send('An unexpected error occured')
  }
}
