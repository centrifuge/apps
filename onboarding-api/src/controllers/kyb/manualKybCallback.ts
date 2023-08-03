import { Request, Response } from 'express'
import { InferType, object, string } from 'yup'
import { onboardingBucket, OnboardingUser, userCollection, validateAndWriteToFirestore } from '../../database'
import { sendDocumentsMessage } from '../../emails/sendDocumentsMessage'
import { sendVerifiedBusinessMessage } from '../../emails/sendVerifiedBusinessMessage'
import { HttpError, reportHttpError } from '../../utils/httpError'
import { shuftiProRequest } from '../../utils/shuftiProRequest'
import { Subset } from '../../utils/types'
import { validateInput } from '../../utils/validateInput'

const manualKybCallbackInput = object({
  poolId: string().optional(),
  trancheId: string().optional(),
})

type VerificationState = 1 | 0 | null

export type ManualKybCallbackRequestBody = {
  reference: `MANUAL_KYB_REFERENCE_${string}`
  event:
    | `request.${'pending' | 'timeout' | 'deleted' | 'received'}`
    | 'review.pending'
    | `verification.${'accepted' | 'declined' | 'cancelled' | 'status.changed'}`
  verification_url: `https://app.shuftipro.com/verification/process/${string}`
  email: string
  country: string

  /**
   * This object will be returned in case of verification.accepted or verification.declined.
   * This object will include all the gathered data in a request process.
   */
  verification_data?: unknown
  verification_result?: {
    proof_stores: {
      articles_of_association: VerificationState
      certificate_of_incorporation: VerificationState
      proof_of_address: VerificationState
      register_of_directors: VerificationState
      register_of_shareholders: VerificationState
      signed_and_dated_ownership_structure: VerificationState
    }
  }
}

export const manualKybCallbackController = async (
  req: Request<any, any, ManualKybCallbackRequestBody, InferType<typeof manualKybCallbackInput>>,
  res: Response
) => {
  try {
    const { body, query } = req

    await validateInput(query, manualKybCallbackInput)

    const userSnapshot = await userCollection.where(`manualKybReference`, '==', body.reference).get()
    if (userSnapshot.empty) {
      throw new Error("User doesn't exist")
    }
    const user = userSnapshot.docs.map((doc) => doc.data())[0] as OnboardingUser

    // find first possible address, assumes the user has only one wallet
    const [network, addresses] =
      Object.entries(user.wallets).find(([, addresses]) => addresses && addresses.length > 0) || []
    if (!network || !addresses) {
      throw new HttpError(404, 'Not found')
    }
    const wallet = {
      address: addresses[0],
      network,
    } as Request['wallet']

    if (user.investorType !== 'entity') {
      throw new HttpError(400, 'User is not an entity')
    }

    if (user.globalSteps.verifyBusiness.completed) {
      throw new HttpError(400, 'Business already verified')
    }

    // if the documents have merely changed status, we don't need to do anything
    if (body.event !== 'verification.status.changed') {
      return res.status(200).end()
    }

    const status = await shuftiProRequest({ reference: body.reference }, { path: 'status' })

    if (status.event === 'verification.declined') {
      await sendVerifiedBusinessMessage(wallet, user.email, false, query?.poolId, query?.trancheId)
      return res.status(200).end()
    }

    if (status.event !== 'verification.accepted') {
      return res.status(200).end()
    }

    const updatedUser: Subset<OnboardingUser> = {
      globalSteps: {
        verifyBusiness: {
          completed: true,
          timeStamp: new Date().toISOString(),
        },
      },
    }

    await validateAndWriteToFirestore(wallet, updatedUser, 'entity', ['globalSteps.verifyBusiness'])
    await sendVerifiedBusinessMessage(wallet, user.email, true, query?.poolId, query?.trancheId)

    if (
      query?.poolId &&
      query?.trancheId &&
      user.poolSteps[query?.poolId]?.[query?.trancheId]?.status.status === 'pending'
    ) {
      const signedAgreement = await fetchSignedAgreement(wallet, query.poolId, query.trancheId)

      if (!signedAgreement) {
        throw new HttpError(400, 'Agreement not found')
      }

      await sendDocumentsMessage(wallet, query.poolId, query.trancheId, signedAgreement)
    }

    return res.status(200).end()
  } catch (e) {
    const error = reportHttpError(e)
    return res.status(error.code).send({ error: error.message })
  }
}

async function fetchSignedAgreement(wallet: Request['wallet'], poolId: string, trancheId: string) {
  const signedAgreement = await onboardingBucket.file(
    `signed-subscription-agreements/${wallet.address}/${poolId}/${trancheId}.pdf`
  )

  const [signedAgreementExists] = await signedAgreement.exists()

  if (!signedAgreementExists) {
    return null
  }

  const pdf = await signedAgreement.download()
  return Uint8Array.from(pdf[0])
}
