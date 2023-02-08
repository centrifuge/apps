import { Request, Response } from 'express'
import { InferType, object, string } from 'yup'
import { validateAndWriteToFirestore } from '../../database'
import { UpdateInvestorStatusPayload } from '../../emails/sendDocumentsToIssuer'
import { fetchUser } from '../../utils/fetchUser'
import { HttpsError } from '../../utils/httpsError'
import { validateInput } from '../../utils/validateInput'
import { verifyJwt } from '../../utils/verifyJwt'

const updateInvestorStatusParams = object({
  token: string().required(),
  status: string().oneOf(['approved', 'rejected']).required(),
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

    await validateAndWriteToFirestore(
      walletAddress,
      {
        onboardingStatus: {
          [poolId]: {
            [trancheId]: {
              status,
              timeStamp: new Date().toISOString(),
            },
          },
        },
      },
      'entity',
      ['onboardingStatus']
    )

    // TODO: send email to investor
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
