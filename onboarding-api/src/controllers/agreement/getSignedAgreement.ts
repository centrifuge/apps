import { Request, Response } from 'express'
import { InferType, object, string } from 'yup'
import { onboardingBucket } from '../../database'
import { HttpError, reportHttpError } from '../../utils/httpError'
import { validateInput } from '../../utils/validateInput'

const getSignedAgreementInput = object({
  poolId: string().required(),
  trancheId: string().required(),
})

export const getSignedAgreementController = async (
  req: Request<{}, {}, {}, InferType<typeof getSignedAgreementInput>>,
  res: Response
) => {
  try {
    await validateInput(req.query, getSignedAgreementInput)
    const { poolId, trancheId } = req.query
    const { walletAddress } = req

    const signedAgreement = await onboardingBucket.file(
      `signed-subscription-agreements/${walletAddress}/${poolId}/${trancheId}.pdf`
    )

    const [signedAgreementExists] = await signedAgreement.exists()

    if (signedAgreementExists) {
      const pdf = await signedAgreement.download()
      return res.send({ signedAgreement: pdf[0] })
    }

    throw new HttpError(400, 'Agreement not found')
  } catch (e) {
    const error = reportHttpError(e)
    return res.status(error.code).send({ error: error.message })
  }
}
