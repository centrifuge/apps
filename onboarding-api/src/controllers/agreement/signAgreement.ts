import { Request, Response } from 'express'
import { PDFDocument } from 'pdf-lib'
import { InferType, object, string } from 'yup'
import {
  onboardingBucket,
  OnboardingUser,
  userCollection,
  validateAndWriteToFirestore,
  writeToOnboardingBucket,
} from '../../database'
import { HttpsError } from '../../utils/httpsError'
import { Subset } from '../../utils/types'
import { validateInput } from '../../utils/validateInput'

const signAgreementInput = object({
  poolId: string().required(),
  trancheId: string().required(),
})

export const signAgreementController = async (
  req: Request<any, any, InferType<typeof signAgreementInput>>,
  res: Response
) => {
  try {
    await validateInput(req.body, signAgreementInput)
    const { poolId, trancheId } = req.body
    const walletAddress = req.walletAddress
    const user = (await userCollection.doc(walletAddress).get())?.data()

    if (user?.steps.verifyIdentity.completed && !user?.steps.signAgreements[poolId]?.[trancheId]?.completed) {
      const unsignedAgreement = await onboardingBucket.file(`subscription-agreements/${poolId}/${trancheId}.pdf`)
      const [unsignedAgreementExists] = await unsignedAgreement.exists()

      if (unsignedAgreementExists) {
        const pdf = await unsignedAgreement.download()

        const pdfDoc = await PDFDocument.load(pdf[0])

        const pages = pdfDoc.getPages()

        const lastPage = pages[pages.length - 1]
        lastPage.drawText(user?.name, {
          x: 100,
          y: 400,
          size: 20,
        })

        const signedAgreement = await pdfDoc.save()

        await writeToOnboardingBucket(
          signedAgreement,
          `signed-subscription-agreements/${walletAddress}/${poolId}/${trancheId}.pdf`
        )

        const updatedUser: Subset<OnboardingUser> = {
          steps: {
            ...user.steps,
            signAgreements: {
              ...user.steps.signAgreements,
              [poolId]: {
                ...user.steps.signAgreements[poolId],
                [trancheId]: {
                  completed: true,
                  timeStamp: new Date().toISOString(),
                },
              },
            },
          },
        }

        await validateAndWriteToFirestore(walletAddress, updatedUser, 'entity', ['steps'])

        const freshUserData = (await userCollection.doc(walletAddress).get()).data()
        return res.status(200).send({ ...freshUserData })
      }

      throw new HttpsError(400, 'Agreement not found')
    }

    throw new HttpsError(400, 'User must be verified before signing agreements')
  } catch (error) {
    if (error instanceof HttpsError) {
      console.log(error.message)
      return res.status(error.code).send(error.message)
    }
    console.log(error)
    return res.status(500).send('An unexpected error occured')
  }
}
