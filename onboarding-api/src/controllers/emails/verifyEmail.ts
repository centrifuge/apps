import { Request, Response } from 'express'
import * as jwt from 'jsonwebtoken'
import { InferType, object, string } from 'yup'
import { EntityUser, OnboardingUser, userCollection, validateAndWriteToFirestore } from '../../database'
import { VerifyEmailPayload } from '../../emails/sendVerifyEmailMessage'
import { HttpsError } from '../../utils/httpsError'
import { Subset } from '../../utils/types'
import { validateInput } from '../../utils/validateInput'

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

    // TODO: fix cors issues
    // TODO: generate secure jwt secret

    const payload = jwt.verify(token, 'mysecret') as VerifyEmailPayload

    const userDoc = await userCollection.doc(payload.walletAddress).get()
    const userData = userDoc.data() as OnboardingUser

    // individual users don't have email addresses yet
    if (!userDoc.exists || userData.investorType !== 'entity') {
      throw new HttpsError(400, 'Bad token')
    }

    if (userData.steps.verifyEmail.completed) {
      throw new HttpsError(404, 'Email already verified')
    }

    const steps: Subset<EntityUser> = {
      steps: { ...userData.steps, verifyEmail: { completed: true, timeStamp: new Date().toISOString() } },
    }

    await validateAndWriteToFirestore(payload.walletAddress, steps, 'entity', ['steps'])
    return res.send(301).redirect(301, `https://dev.app.cntrfg.com/onboarding`)
  } catch (error) {
    if (error instanceof HttpsError) {
      console.log(error.message)
      return res.status(error.code).send(error.message)
    }
    console.log(error)
    return res.status(500).send('An unexpected error occured')
  }
}
