import { Request, Response } from 'express'
import { InferType, object, string } from 'yup'
import { validateAndWriteToFirestore } from '../../database'
import { sendVerifyEmailMessage } from '../../emails/sendVerifyEmailMessage'
import { fetchUser } from '../../utils/fetchUser'
import { HttpsError } from '../../utils/httpsError'
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
      walletAddress,
      body: { email },
    } = req
    const user = await fetchUser(walletAddress)

    if (!user.email) {
      throw new HttpsError(400, 'Bad request')
    }

    if (user.globalSteps.verifyEmail.completed) {
      throw new HttpsError(400, 'Email already verified')
    }

    if (email && email !== user.email) {
      await validateAndWriteToFirestore(walletAddress, { email }, 'entity', ['email'])
    }
    const freshUserData = await fetchUser(walletAddress)
    await sendVerifyEmailMessage(freshUserData)
    return res.status(200).send({ ...freshUserData })
  } catch (error) {
    if (error instanceof HttpsError) {
      console.log(error.message)
      return res.status(error.code).send(error.message)
    }
    console.log(error)
    return res.status(500).send({ error: 'An unexpected error occured' })
  }
}
