import { Request, Response } from 'express'
import { InferType, object, string } from 'yup'
import { EntityUser, validateAndWriteToFirestore } from '../../database'
import { VerifyEmailPayload } from '../../emails/sendVerifyEmailMessage'
import { fetchUser } from '../../utils/fetchUser'
import { HttpsError } from '../../utils/httpsError'
import { Subset } from '../../utils/types'
import { validateInput } from '../../utils/validateInput'
import { verifyJwt } from '../../utils/verifyJwt'

const verifyEmailParams = object({
  token: string().required(),
})

export const verifyEmailController = async (
  req: Request<any, any, any, InferType<typeof verifyEmailParams>>,
  res: Response
) => {
  try {
    await validateInput(req.query, verifyEmailParams)
    const {
      query: { token },
    } = req
    const payload = verifyJwt<VerifyEmailPayload>(token)
    const user = await fetchUser(payload.walletAddress)

    // individual users don't have email addresses yet
    if (user.investorType !== 'entity') {
      throw new HttpsError(400, 'Bad request')
    }

    if (user.steps.verifyEmail.completed) {
      throw new HttpsError(400, 'Email already verified')
    }

    const steps: Subset<EntityUser> = {
      steps: { ...user.steps, verifyEmail: { completed: true, timeStamp: new Date().toISOString() } },
    }

    await validateAndWriteToFirestore(payload.walletAddress, steps, 'entity', ['steps'])
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
