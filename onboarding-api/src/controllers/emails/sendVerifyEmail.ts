import { Request, Response } from 'express'
import { InferType, object, string } from 'yup'
import { validateAndWriteToFirestore } from '../../database'
import { sendVerifyEmailMessage } from '../../emails/sendVerifyEmailMessage'
import { fetchUser } from '../../utils/fetchUser'
import { HttpError, reportHttpError } from '../../utils/httpError'
import { validateInput } from '../../utils/validateInput'

const sendVerifyEmailInput = object({
  email: string().email().optional(),
})

export const sendVerifyEmailController = async (
  req: Request<any, any, InferType<typeof sendVerifyEmailInput>>,
  res: Response
) => {
  try {
    await validateInput(req.body, sendVerifyEmailInput)
    const {
      wallet,
      body: { email },
    } = req
    const user = await fetchUser(wallet)

    if (!user.email) {
      throw new HttpError(400, 'Bad request')
    }

    if (user.globalSteps.verifyEmail.completed) {
      throw new HttpError(400, 'Email already verified')
    }

    if (email && email !== user.email) {
      await validateAndWriteToFirestore(wallet.address, { email }, user.investorType, ['email'])
    }
    const freshUserData = await fetchUser(wallet)
    await sendVerifyEmailMessage(freshUserData, wallet)
    return res.status(200).send({ ...freshUserData })
  } catch (e) {
    const error = reportHttpError(e)
    return res.status(error.code).send({ error: error.message })
  }
}
