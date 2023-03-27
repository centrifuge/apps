import { Request, Response } from 'express'
import { OnboardingUser, validateAndWriteToFirestore } from '../../database'
import { fetchUser } from '../../utils/fetchUser'
import { HttpError, reportHttpError } from '../../utils/httpError'
import { Subset } from '../../utils/types'

export const verifyAccreditationController = async (req: Request, res: Response) => {
  try {
    const user = await fetchUser(req.wallet)

    if (user.globalSteps.verifyAccreditation.completed) {
      throw new HttpError(400, 'Unable to process request')
    }

    if (user.investorType === 'entity' && !user.jurisdictionCode.startsWith('us')) {
      throw new HttpError(400, 'Only US entities need to verify their accreditation status')
    }

    if (user.investorType === 'individual' && user.countryOfCitizenship !== 'us') {
      throw new HttpError(400, 'Only US individuals need to verify their accreditation status')
    }

    const updatedUser: Subset<OnboardingUser> = {
      globalSteps: {
        ...user.globalSteps,
        verifyAccreditation: {
          completed: true,
          timeStamp: new Date().toISOString(),
        },
      },
    }
    await validateAndWriteToFirestore(req.wallet, updatedUser, 'entity', ['globalSteps'])
    const freshUserData = await fetchUser(req.wallet)
    return res.status(200).send({ ...freshUserData })
  } catch (e) {
    const error = reportHttpError(e)
    return res.status(error.code).send({ error: error.message })
  }
}
