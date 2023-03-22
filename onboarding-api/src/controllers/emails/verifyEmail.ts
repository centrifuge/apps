import { Request, Response } from 'express'
import { InferType, object, string } from 'yup'
import { EntityUser, validateAndWriteToFirestore } from '../../database'
import { VerifyEmailPayload } from '../../emails/sendVerifyEmailMessage'
import { fetchUser } from '../../utils/fetchUser'
import { HttpError, reportHttpError } from '../../utils/httpError'
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
    const user = await fetchUser(payload.wallet)

    if (user.globalSteps.verifyEmail.completed) {
      throw new HttpError(400, 'Email already verified')
    }

    const globalSteps: Subset<EntityUser> = {
      globalSteps: { verifyEmail: { completed: true, timeStamp: new Date().toISOString() } },
    }

    await validateAndWriteToFirestore(payload.wallet, globalSteps, 'entity', ['globalSteps.verifyEmail'])
    return res.status(204).send()
  } catch (e) {
    const error = reportHttpError(e)
    return res.status(error.code).send({ error: error.message })
  }
}
