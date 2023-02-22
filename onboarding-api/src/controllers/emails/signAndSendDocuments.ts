import { Request, Response } from 'express'
import { InferType, object, string } from 'yup'
import {
  onboardingBucket,
  OnboardingUser,
  userCollection,
  validateAndWriteToFirestore,
  writeToOnboardingBucket,
} from '../../database'
import { sendDocuments } from '../../emails/sendDocuments'
import { fetchUser } from '../../utils/fetchUser'
import { HttpsError } from '../../utils/httpsError'
import { signAndAnnotateAgreement } from '../../utils/signAndAnnotateAgreement'
import { validateInput } from '../../utils/validateInput'
import { validateRemark } from '../../utils/validateRemark'

export const signAndSendDocumentsInput = object({
  poolId: string().required(),
  trancheId: string().required(),
  transactionInfo: object({
    extrinsicHash: string().required(),
    blockNumber: string().required(),
  }).required(),
})

export const signAndSendDocumentsController = async (
  req: Request<any, any, InferType<typeof signAndSendDocumentsInput>>,
  res: Response
) => {
  try {
    await validateInput(req.body, signAndSendDocumentsInput)

    const { poolId, trancheId, transactionInfo } = req.body
    const { walletAddress } = req

    const user = await fetchUser(walletAddress)

    await validateRemark(transactionInfo, `Signed subscription agreement for pool: ${poolId} tranche: ${trancheId}`)

    if (
      !user?.steps.signAgreements[poolId]?.[trancheId]?.signedDocument &&
      user?.onboardingStatus[poolId]?.[trancheId]?.status !== null
    ) {
      throw new HttpsError(400, 'User must sign document before documents can be sent to issuer')
    }

    const unsignedAgreement = await onboardingBucket.file(`subscription-agreements/${poolId}/${trancheId}.pdf`)
    const [unsignedAgreementExists] = await unsignedAgreement.exists()

    if (!unsignedAgreementExists) {
      throw new HttpsError(400, 'Agreement not found')
    }

    const pdfDoc = await signAndAnnotateAgreement(
      unsignedAgreement,
      walletAddress,
      transactionInfo,
      user?.name as string
    )

    const signedAgreementPDF = await pdfDoc.save()

    await writeToOnboardingBucket(
      signedAgreementPDF,
      `signed-subscription-agreements/${walletAddress}/${poolId}/${trancheId}.pdf`
    )

    const taxInfo = await onboardingBucket.file(`tax-information/${walletAddress}.pdf`)

    const [taxInfoExists] = await taxInfo.exists()

    if (!taxInfoExists) {
      throw new HttpsError(400, 'Tax info not found')
    }

    const taxInfoPDF = await taxInfo.download()

    await sendDocuments(
      walletAddress,
      poolId,
      trancheId,
      taxInfoPDF[0].toString('base64'),
      Buffer.from(signedAgreementPDF).toString('base64')
    )

    await validateAndWriteToFirestore(
      walletAddress,
      {
        onboardingStatus: {
          [poolId]: {
            [trancheId]: {
              status: 'pending',
              timeStamp: new Date().toISOString(),
            },
          },
        },
        steps: {
          ...user?.steps,
          signAgreements: {
            [poolId]: {
              [trancheId]: {
                signedDocument: true,
                transactionInfo,
              },
            },
          },
        },
      },
      'entity',
      ['onboardingStatus', 'steps']
    )
    const freshUserData = (await userCollection.doc(walletAddress).get()).data() as OnboardingUser
    return res.status(201).send({ ...freshUserData })
  } catch (error) {
    if (error instanceof HttpsError) {
      console.log(error.message)
      return res.status(error.code).send(error.message)
    }
    console.log(error)
    return res.status(500).send({ error: 'An unexpected error occured' })
  }
}
