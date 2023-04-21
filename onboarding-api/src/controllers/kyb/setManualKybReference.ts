import { Request, Response } from 'express'
import { InferType, object, string } from 'yup'
import { OnboardingUser, validateAndWriteToFirestore } from '../../database'
import { sendVerifyEmailMessage } from '../../emails/sendVerifyEmailMessage'
import { fetchUser } from '../../utils/fetchUser'
import { HttpError, reportHttpError } from '../../utils/httpError'
import { Subset } from '../../utils/types'
import { validateInput } from '../../utils/validateInput'

const verifyBusinessInput = object({
  manualKybReference: string().email().required(),
})

export const setManualKybReference = async (
  req: Request<any, any, InferType<typeof verifyBusinessInput>>,
  res: Response
) => {
  try {
    const { body, wallet } = req
    await validateInput(body, verifyBusinessInput)

    const user = await fetchUser(wallet)

    if (user?.investorType !== 'entity') {
      throw new HttpError(400, 'Setting a manual kyb reference is only available for investorType "entity"')
    }

    if (user.globalSteps.verifyBusiness.completed) {
      throw new HttpError(400, 'Business already verified')
    }

    if (user.manualKybReference && !user.globalSteps.verifyBusiness.completed) {
      throw new HttpError(400, 'Business already in review')
    }

    const updatedUser: Subset<OnboardingUser> = {
      manualKybReference: body.manualKybReference,
    }

    await validateAndWriteToFirestore(wallet, updatedUser, 'entity', ['manualKybReference'])

    await sendVerifyEmailMessage(user, wallet)
    const freshUserData = await fetchUser(wallet)

    return res.status(200).json({ ...freshUserData })
  } catch (e) {
    const error = reportHttpError(e)
    return res.status(error.code).send({ error: error.message })
  }
}
