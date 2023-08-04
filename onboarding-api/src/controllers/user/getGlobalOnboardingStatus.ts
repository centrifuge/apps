import { Request, Response } from 'express'
import { InferType, mixed, object, string } from 'yup'
import { SupportedNetworks } from '../../database'
import { fetchUser } from '../../utils/fetchUser'
import { reportHttpError } from '../../utils/httpError'
import { validateInput } from '../../utils/validateInput'

const getGlobalOnboardingStatusInput = object({
  address: string().required(),
  network: mixed<SupportedNetworks>().required().oneOf(['evm', 'substrate']),
})

export const getGlobalOnboardingStatusController = async (
  req: Request<{}, {}, {}, InferType<typeof getGlobalOnboardingStatusInput>>,
  res: Response
) => {
  try {
    await validateInput(req.query, getGlobalOnboardingStatusInput)

    const user = await fetchUser(req.query, { suppressError: true })

    if (!user) {
      return res.send({ onboardingGlobalStatus: 'unverified' })
    }

    const requiredGlobalSteps = Object.keys(user.globalSteps).filter((globalStep) => {
      if (
        (user.investorType === 'individual' && user.countryOfCitizenship === 'us') ||
        (user.investorType === 'entity' && user.jurisdictionCode.startsWith('us'))
      ) {
        return true
      }

      return globalStep !== 'verifyAccreditation'
    }) as Array<keyof typeof user.globalSteps>

    const onboardingGlobalStatus = requiredGlobalSteps.every((step) => user.globalSteps[step].completed)
      ? 'verified'
      : 'pending'

    return res.send({ onboardingGlobalStatus })
  } catch (e) {
    const error = reportHttpError(e)
    return res.status(error.code).send({ error: error.message })
  }
}
