import { Request, Response } from 'express'
import { bool, InferType, object } from 'yup'
import { OnboardingUser, validateAndWriteToFirestore } from '../../database'
import { sendVerifyEmailMessage } from '../../emails/sendVerifyEmailMessage'
import { fetchUser } from '../../utils/fetchUser'
import { HttpError, reportHttpError } from '../../utils/httpError'
import { shuftiProRequest } from '../../utils/shuftiProRequest'
import { Subset } from '../../utils/types'

const setVerifiedIdentityInput = object({
  dryRun: bool().optional(),
})

export const setVerifiedIdentityController = async (
  req: Request<any, any, InferType<typeof setVerifiedIdentityInput>>,
  res: Response
) => {
  try {
    const {
      body: { dryRun },
      wallet,
    } = { ...req }
    const user = await fetchUser(wallet)

    if (user.globalSteps.verifyIdentity.completed) {
      throw new HttpError(400, 'Step aleady completed')
    }

    const status = await shuftiProRequest({ reference: user.kycReference }, { path: 'status', dryRun })
    if (status.event !== 'verification.accepted') {
      throw new HttpError(400, `Failed because ${status.reference} is in "${status.event}" state`)
    }

    const address = status.verification_data?.address?.full_address || null

    const updatedUser: Subset<OnboardingUser> = {
      address,
      globalSteps: {
        verifyIdentity: {
          completed: true,
          timeStamp: new Date().toISOString(),
        },
      },
    }
    await validateAndWriteToFirestore(wallet, updatedUser, user.investorType, ['address', 'globalSteps.verifyIdentity'])
    if (user.investorType === 'individual') {
      await sendVerifyEmailMessage(user, wallet)
    }
    const freshUserData = await fetchUser(wallet)
    return res.status(200).send({ ...freshUserData })
  } catch (e) {
    const error = reportHttpError(e)
    return res.status(error.code).send({ error: error.message })
  }
}
