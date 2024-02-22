import { Request } from 'express'
import { onboardingBucket } from '../database'
import { fetchUser } from './fetchUser'
import { HttpError } from './httpError'

export const fetchTaxInfo = async (wallet: Request['wallet']) => {
  const user = await fetchUser(wallet)
  const path = user?.taxDocument
    ? `${user.taxDocument.split('/').at(-2)}/${user.taxDocument.split('/').at(-1)}`
    : `tax-information/${wallet.address}.pdf`
  const taxInfo = await onboardingBucket.file(path)

  const [taxInfoExists] = await taxInfo.exists()

  if (!taxInfoExists) {
    throw new HttpError(404, 'Tax info not found')
  }

  const taxInfoPDF = await taxInfo.download()
  return taxInfoPDF[0]
}
