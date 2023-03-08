import { Request, Response } from 'express'
import { fileTypeFromBuffer } from 'file-type'
import { OnboardingUser, validateAndWriteToFirestore, writeToOnboardingBucket } from '../../database'
import { fetchUser } from '../../utils/fetchUser'
import { HttpError, reportHttpError } from '../../utils/httpError'
import { Subset } from '../../utils/types'

const validateTaxInfoFile = async (file: Buffer) => {
  if (file.length > 1024 * 1024) {
    throw new HttpError(400, 'Maximum file size allowed is 1MB')
  }

  const fileString = file.toString('utf8')

  const body = fileString.slice(fileString.indexOf('\r\n\r\n') + 4)
  const type = await fileTypeFromBuffer(Buffer.from(body))

  if (type?.mime !== 'application/pdf') {
    throw new HttpError(400, 'Only PDF files are allowed')
  }
}

export const uploadTaxInfoController = async (req: Request, res: Response) => {
  try {
    await validateTaxInfoFile(req.body)

    const { walletAddress } = req

    const user = await fetchUser(walletAddress)

    await writeToOnboardingBucket(Uint8Array.from(req.body), `tax-information/${walletAddress}.pdf`)

    const updatedUser: Subset<OnboardingUser> = {
      globalSteps: {
        ...user.globalSteps,
        verifyTaxInfo: {
          completed: true,
          timeStamp: new Date().toISOString(),
        },
      },
    }

    await validateAndWriteToFirestore(walletAddress, updatedUser, 'entity', ['globalSteps'])

    const freshUserData = await fetchUser(walletAddress)
    return res.status(200).send({ ...freshUserData })
  } catch (e) {
    const error = reportHttpError(e)
    return res.status(error.code).send({ error: error.message })
  }
}
