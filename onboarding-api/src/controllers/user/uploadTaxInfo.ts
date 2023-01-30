import { Request, Response } from 'express'
import { fileTypeFromBuffer } from 'file-type'
import { InferType, object, string } from 'yup'
import { OnboardingUser, userCollection, validateAndWriteToFirestore, writeToOnboardingBucket } from '../../database'
import { HttpsError } from '../../utils/httpsError'
import { Subset } from '../../utils/types'
import { validateInput } from '../../utils/validateInput'

const uploadTaxInfoInput = object({
  poolId: string().required(),
  trancheId: string().required(),
})

const validateTaxInfoFile = async (file: Buffer) => {
  if (file.length > 1024 * 1024) {
    throw new HttpsError(400, 'Maximum file size allowed is 1MB')
  }

  const fileString = file.toString('utf8')

  const body = fileString.slice(fileString.indexOf('\r\n\r\n') + 4)
  const type = await fileTypeFromBuffer(Buffer.from(body))

  if (type?.mime !== 'application/pdf') {
    throw new HttpsError(400, 'Only PDF files are allowed')
  }
}

export const uploadTaxInfoController = async (
  req: Request<{}, {}, Buffer, InferType<typeof uploadTaxInfoInput>>,
  res: Response
) => {
  try {
    await validateTaxInfoFile(req.body)
    await validateInput(req.query, uploadTaxInfoInput)

    const { poolId, trancheId } = req.query
    const { walletAddress } = req

    const user = (await userCollection.doc(walletAddress).get())?.data()

    if (user) {
      await writeToOnboardingBucket(
        Uint8Array.from(req.body),
        `tax-information/${walletAddress}/${poolId}/${trancheId}.pdf`
      )

      const updatedUser: Subset<OnboardingUser> = {
        steps: {
          ...user.steps,
          verifyTaxInfo: {
            completed: true,
            timeStamp: new Date().toISOString(),
          },
        },
      }

      await validateAndWriteToFirestore(walletAddress, updatedUser, 'entity', ['steps'])

      const freshUserData = (await userCollection.doc(walletAddress).get()).data()
      return res.status(200).send({ ...freshUserData })
    }

    throw new HttpsError(400, 'User not found')
  } catch (error) {
    if (error instanceof HttpsError) {
      console.log(error.message)
      return res.status(error.code).send(error.message)
    }
    console.log(error)
    return res.status(500).send('An unexpected error occured')
  }
}
