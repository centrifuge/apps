import { Request, Response } from 'express'
import { onboardingBucket } from '../../database'
import { HttpsError } from '../../utils/httpsError'

export const getTaxInfoController = async (req: Request, res: Response) => {
  try {
    const { walletAddress } = req

    const taxInfo = await onboardingBucket.file(`tax-information/${walletAddress}.pdf`)

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
