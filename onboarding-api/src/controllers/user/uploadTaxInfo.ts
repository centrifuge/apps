import { Request, Response } from 'express'
import { OnboardingUser, validateAndWriteToFirestore, writeToOnboardingBucket } from '../../database'
import { fetchUser } from '../../utils/fetchUser'
import { HttpError, reportHttpError } from '../../utils/httpError'
import { Subset } from '../../utils/types'

const validateFileSize = async (file?: Buffer) => {
  if (!file) {
    throw new HttpError(400, 'File not found')
  }

  if (file.byteLength > 1024 * 1024) {
    throw new HttpError(400, 'File size must be less than 1MB')
  }
}

export const uploadTaxInfoController = async (req: Request, res: Response) => {
  try {
    await validateFileSize(req.body)
    const { wallet } = req
    const user = await fetchUser(wallet)

    let taxDocument = ''
    if (user?.taxDocument) {
      const taxDoc = user.taxDocument.split('/')
      const version = taxDoc[taxDoc.length - 1].split('.')[0].split('_')[1] ?? '0'
      const newVersion = Number(version) + 1
      taxDocument = `tax-information/${wallet.address}_${newVersion}.pdf`
    } else {
      taxDocument = `tax-information/${wallet.address}.pdf`
    }

    const updatedUser: Subset<OnboardingUser> = {
      taxDocument: `${process.env.ONBOARDING_STORAGE_BUCKET}/${taxDocument}`,
    }
    await writeToOnboardingBucket(Uint8Array.from(req.body), taxDocument)
    await validateAndWriteToFirestore(wallet, updatedUser, user.investorType, ['taxDocument'])

    const freshUserData = await fetchUser(wallet)
    return res.status(200).send({ ...freshUserData })
  } catch (e) {
    const error = reportHttpError(e)
    return res.status(error.code).send({ error: error.message })
  }
}
