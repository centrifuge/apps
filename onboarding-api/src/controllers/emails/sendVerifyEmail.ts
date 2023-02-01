import { Request, Response } from 'express'
import { InferType, object, string } from 'yup'
import { OnboardingUser, userCollection, validateAndWriteToFirestore } from '../../database'
import { sendVerifyEmailMessage } from '../../emails/sendVerifyEmailMessage'
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
    const userDoc = await userCollection.doc(walletAddress).get()
    const userData = userDoc.data() as OnboardingUser

    // individual users don't have email addresses yet
    if (!userDoc.exists || userData.investorType !== 'entity') {
      throw new HttpsError(404, 'User not found')
    }

    if (userData.steps.verifyEmail.completed) {
      throw new HttpsError(404, 'Email already verified')
    }

    if (email !== userData.email) {
      await validateAndWriteToFirestore(walletAddress, { email }, 'entity', ['email'])
    }
    const freshUserData = (await userCollection.doc(walletAddress).get()).data() as OnboardingUser
    await sendVerifyEmailMessage(freshUserData)
    return res.status(200).send({ ...freshUserData })
  } catch (error) {
    if (error instanceof HttpsError) {
      console.log(error.message)
      return res.status(error.code).send(error.message)
    }
    console.log(error)
    return res.status(500).send('An unexpected error occured')
  }
}
