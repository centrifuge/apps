import { Request, Response } from 'express'
import { InferType, object, string } from 'yup'
import { onboardingBucket, OnboardingUser, userCollection, validateAndWriteToFirestore } from '../../database'
import { sendDocumentsToIssuer } from '../../emails/sendDocumentsToIssuer'
import { fetchUser } from '../../utils/fetchUser'
import { HttpsError } from '../../utils/httpsError'
import { validateInput } from '../../utils/validateInput'

const sendDocumentsToIssuerInput = object({
  poolId: string().required(),
  trancheId: string().required(),
})

export const sendDocumentsToIssuerController = async (
  req: Request<any, any, InferType<typeof sendDocumentsToIssuerInput>>,
  res: Response
) => {
  try {
    await validateInput(req.body, sendDocumentsToIssuerInput)

    const { poolId, trancheId } = req.body
    const { walletAddress } = req

    const user = await fetchUser(walletAddress)

    if (
      !user?.steps.signAgreements[poolId]?.[trancheId]?.signedDocument &&
      user?.onboardingStatus[poolId]?.[trancheId]?.status !== null
    ) {
      throw new HttpsError(400, 'User must sign document before documents can be sent to issuer')
    }

    const signedAgreement = await onboardingBucket.file(
      `signed-subscription-agreements/${walletAddress}/${poolId}/${trancheId}.pdf`
    )

    const [signedAgreementExists] = await signedAgreement.exists()

    const taxInfo = await onboardingBucket.file(`tax-information/${walletAddress}/${poolId}/${trancheId}.pdf`)

    const [taxInfoExists] = await taxInfo.exists()

    if (!signedAgreementExists || !taxInfoExists) {
      throw new HttpsError(400, 'Signed agreement or tax info not found')
    }

    const signedAgreementPDF = await signedAgreement.download()
    const taxInfoPDF = await taxInfo.download()

    await sendDocumentsToIssuer(
      'jp@k-f.co',
      walletAddress,
      poolId,
      trancheId,
      taxInfoPDF[0].toString('base64'),
      signedAgreementPDF[0].toString('base64')
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
      },
      'entity',
      ['onboardingStatus']
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
