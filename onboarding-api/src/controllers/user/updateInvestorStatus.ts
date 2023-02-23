import { Request, Response } from 'express'
import { InferType, object, string, StringSchema } from 'yup'
import { OnboardingUser, validateAndWriteToFirestore } from '../../database'
import { sendApproveInvestorMessage } from '../../emails/sendApproveInvestorMessage'
import { UpdateInvestorStatusPayload } from '../../emails/sendDocuments'
import { sendRejectInvestorMessage } from '../../emails/sendRejectInvestorMessage'
import { addInvestorToMemberList } from '../../utils/centrifuge'
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

    const incompleteSteps = Object.entries(user.globalSteps).filter(([name, step]) => {
      if (
        name === 'verifyAccreditation' &&
        user.investorType === 'individual' &&
        user.countryOfCitizenship?.startsWith('us')
      ) {
        return !step?.completed
      }

      if (name === 'verifyAccreditation' && user.investorType === 'entity' && user.jurisdictionCode?.startsWith('us')) {
        return !step?.completed
      }
      return false
    })

    if (incompleteSteps.length > 0) {
      throw new HttpsError(
        400,
        `Incomplete onboarding steps for investor: ${incompleteSteps.map((step) => step[0]).join(', ')}`
      )
    }

    if (user.poolSteps[poolId][trancheId].status.status !== 'pending') {
      throw new HttpsError(400, 'Investor status may have already been updated')
    }

    if (!user.poolSteps?.[poolId][trancheId].signAgreement.completed) {
      throw new HttpsError(400, 'Argeements must be signed before investor status can invest')
    }

    const updatedUser: Subset<OnboardingUser> = {
      poolSteps: {
        ...user.poolSteps,
        [poolId]: {
          [trancheId]: {
            ...user.poolSteps[poolId][trancheId].signAgreement,
            status: {
              status,
              timeStamp: new Date().toISOString(),
            },
          },
        },
      },
    }

    await validateAndWriteToFirestore(walletAddress, updatedUser, 'entity', ['poolSteps'])

    if (user?.email && status === 'approved') {
      await addInvestorToMemberList(walletAddress, poolId, trancheId)
      await sendApproveInvestorMessage(user.email, poolId, trancheId)
      return res.status(204).send()
    } else if (user?.email && status === 'rejected') {
      await sendRejectInvestorMessage(user.email, poolId)
      throw new HttpsError(400, 'Investor has been rejected')
    }
    throw new HttpsError(400, 'Investor status may have already been updated')
  } catch (error) {
    if (error instanceof HttpsError) {
      console.log(error.message)
      return res.status(error.code).send(error.message)
    }
    console.log(error)
    return res.status(500).send('An unexpected error occured')
  }
}
