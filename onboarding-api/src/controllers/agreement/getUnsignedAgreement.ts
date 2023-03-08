import { Request, Response } from 'express'
import { InferType, object, string } from 'yup'
import { onboardingBucket } from '../../database'
import { HttpError, reportHttpError } from '../../utils/httpError'
import { validateInput } from '../../utils/validateInput'

const getUnsignedAgreementInput = object({
  poolId: string().required(),
  trancheId: string().required(),
})

export const getUnsignedAgreementController = async (
  req: Request<{}, {}, {}, InferType<typeof getUnsignedAgreementInput>>,
  res: Response
) => {
  try {
    await validateInput(req.query, getUnsignedAgreementInput)
    const { poolId, trancheId } = req.query
    const unsignedAgreement = await onboardingBucket.file(`subscription-agreements/${poolId}/${trancheId}.pdf`)

    const [unsignedAgreementExists] = await unsignedAgreement.exists()

    if (unsignedAgreementExists) {
      const pdf = await unsignedAgreement.download()
      return res.send({ unsignedAgreement: pdf[0] })
    }

    throw new HttpError(400, 'Agreement not found')
  } catch (e) {
    const error = reportHttpError(e)
    return res.status(error.code).send({ error: error.message })
  }
}
