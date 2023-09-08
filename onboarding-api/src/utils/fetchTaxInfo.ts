import { Request } from 'express'
import { onboardingBucket } from '../database'
import { HttpError } from './httpError'

export const fetchTaxInfo = async (wallet: Request['wallet']) => {
  const taxInfoFile = await onboardingBucket.file(`tax-information/${wallet.address}.pdf`)
  const [taxInfoExists] = await taxInfoFile.exists()

  if (!taxInfoExists) {
    throw new HttpError(400, 'Tax info not found')
  }
  const taxInfoPDF = await taxInfoFile.download()
  return taxInfoPDF
}
