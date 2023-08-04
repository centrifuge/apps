import { Request, Response } from 'express'
import { onboardingBucket } from '../../database'
import { HttpError, reportHttpError } from '../../utils/httpError'

export const getTaxInfoController = async (req: Request, res: Response) => {
  try {
    const {
      wallet: { address },
    } = req

    const taxInfo = await onboardingBucket.file(`tax-information/${address}.pdf`)

    const [taxInfoExists] = await taxInfo.exists()

    if (!taxInfoExists) {
      throw new HttpError(404, 'Tax info not found')
    }

    const pdf = await taxInfo.download()
    return res.send({ taxInfo: pdf[0] })
  } catch (e) {
    const error = reportHttpError(e)
    return res.status(error.code).send({ error: error.message })
  }
}
