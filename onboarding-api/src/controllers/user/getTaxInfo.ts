import { Request, Response } from 'express'
import { InferType, object, string } from 'yup'
import { onboardingBucket } from '../../database'
import { HttpsError } from '../../utils/httpsError'
import { validateInput } from '../../utils/validateInput'

const getTaxInfoInput = object({
  poolId: string().required(),
  trancheId: string().required(),
})

export const getTaxInfoController = async (
  req: Request<{}, {}, {}, InferType<typeof getTaxInfoInput>>,
  res: Response
) => {
  try {
    await validateInput(req.query, getTaxInfoInput)

    const { poolId, trancheId } = req.query
    const { walletAddress } = req

    const taxInfo = await onboardingBucket.file(`tax-information/${walletAddress}/${poolId}/${trancheId}.pdf`)

    const [taxInfoExists] = await taxInfo.exists()

    if (!taxInfoExists) {
      throw new HttpsError(400, 'Tax info not found')
    }

    const pdf = await taxInfo.download()
    return res.send({ taxInfo: pdf[0] })
  } catch (error) {
    if (error instanceof HttpsError) {
      console.log(error.message)
      return res.status(error.code).send(error.message)
    }
    console.log(error)
    return res.status(500).send('An unexpected error occured')
  }
}
