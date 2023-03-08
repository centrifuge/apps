import { Request, Response } from 'express'
import { array, date, InferType, object, string } from 'yup'
import { EntityUser, validateAndWriteToFirestore } from '../../database'
import { fetchUser } from '../../utils/fetchUser'
import { HttpError, reportHttpError } from '../../utils/httpError'
import { Subset } from '../../utils/types'
import { validateInput } from '../../utils/validateInput'

const confirmOwnersInput = object({
  ultimateBeneficialOwners: array(
    object({
      name: string().required(),
      dateOfBirth: date().required().min(new Date(1900, 0, 1)).max(new Date()),
      countryOfResidency: string().required(),
      countryOfCitizenship: string().required(),
    }).required()
  )
    .min(1)
    .max(3),
})

export const confirmOwnersController = async (
  req: Request<any, any, InferType<typeof confirmOwnersInput>>,
  res: Response
) => {
  try {
    await validateInput(req.body, confirmOwnersInput)
    const { walletAddress } = req
    const user = await fetchUser(walletAddress)
    if (user.investorType !== 'entity') {
      throw new HttpError(404, 'Business not found')
    }

    if (!user.globalSteps.verifyBusiness.completed) {
      throw new HttpError(400, 'Business must be verified before confirming ownership')
    }

    if (user?.globalSteps.confirmOwners.completed) {
      throw new HttpError(400, 'Owners already confirmed')
    }

    if (!user.globalSteps.verifyEmail.completed) {
      throw new HttpError(400, 'Email must be verified before completing business verification')
    }

    const verifyEntity: Subset<EntityUser> = {
      ultimateBeneficialOwners: req.body.ultimateBeneficialOwners,
      globalSteps: { ...user.globalSteps, confirmOwners: { completed: true, timeStamp: new Date().toISOString() } },
    }

    await validateAndWriteToFirestore(walletAddress, verifyEntity, 'entity', [
      'globalSteps',
      'ultimateBeneficialOwners',
    ])

    const freshUserData = await fetchUser(walletAddress)
    return res.status(200).send({ ...freshUserData })
  } catch (e) {
    const error = reportHttpError(e)
    return res.status(error.code).send({ error: error.message })
  }
}
