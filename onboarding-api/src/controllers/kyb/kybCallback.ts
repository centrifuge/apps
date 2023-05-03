import * as crypto from 'crypto'
import { Request, Response } from 'express'
import { InferType, mixed, object, string } from 'yup'
import { onboardingBucket, OnboardingUser, validateAndWriteToFirestore } from '../../database'
import { sendDocumentsMessage } from '../../emails/sendDocumentsMessage'
import { sendVerifiedBusinessMessage } from '../../emails/sendVerifiedBusinessMessage'
import { fetchUser } from '../../utils/fetchUser'
import { HttpError, reportHttpError } from '../../utils/httpError'
import { shuftiProRequest } from '../../utils/shuftiProRequest'
import { Subset, SupportedNetworks } from '../../utils/types'
import { validateInput } from '../../utils/validateInput'

type VerificationState = 1 | 0 | null

type RequestBody = {
  reference: `KYB_${string}`
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

const kybCallbackInput = object({
  address: string().required(),
  network: mixed<SupportedNetworks>().required().oneOf(['evm', 'substrate']),
  poolId: string().optional(),
  trancheId: string().optional(),
})

export const kybCallbackController = async (
  req: Request<any, any, RequestBody, InferType<typeof kybCallbackInput>>,
  res: Response
) => {
  try {
    const { headers, body, query } = req

    await validateInput(query, kybCallbackInput)

    const wallet: Request['wallet'] = {
      address: query.address,
      network: query.network,
    }

    const user = await fetchUser(wallet)

    if (user.investorType !== 'entity') {
      throw new HttpError(400, 'User is not an entity')
    }

    if (user.globalSteps.verifyBusiness.completed) {
      throw new HttpError(400, 'Business already verified')
    }

    const isValidRequest = headers.signature && isValidShuftiRequest(body, headers.signature)

    if (!isValidRequest) {
      throw new HttpError(401, 'Unauthorized')
    }

    if (body.event !== 'verification.status.changed') {
      return res.status(200).end()
    }

    const status: RequestBody = await shuftiProRequest({ reference: body.reference }, { path: 'status', dryRun: false })

    if (status.event === 'verification.declined') {
      await sendVerifiedBusinessMessage(user.email, false, query.poolId, query.trancheId)
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
    await sendVerifiedBusinessMessage(user.email, true, query.poolId, query.trancheId)

    if (
      query.poolId &&
      query.trancheId &&
      user.poolSteps[query.poolId]?.[query.trancheId]?.status.status === 'pending'
    ) {
      const signedAgreement = await fetchSignedAgreement(wallet, query.poolId, query.trancheId)

      if (!signedAgreement) {
        throw new HttpError(400, 'Agreement not found')
      }

      sendDocumentsMessage(wallet, query.poolId, query.trancheId, signedAgreement)
    }

    return res.status(200).end()
  } catch (e) {
    const error = reportHttpError(e)
    return res.status(error.code).send({ error: error.message })
  }
}

function isValidShuftiRequest(body: RequestBody, signature: string | string[]) {
  const requestBody = JSON.stringify(body)
    //  escape all `/`
    .replace(/\//g, '\\/')

    // replace greek characters with unicodes
    .replace(/\u00f4/g, '\\u00f4')
    .replace(/\u00fa/g, '\\u00fa')
    .replace(/\u039a/g, '\\u039a')
    .replace(/\u039d/g, '\\u039d')
    .replace(/\u03a4/g, '\\u03a4')
    .replace(/\u0399/g, '\\u0399')

  const hash = crypto.createHash('sha256').update(`${requestBody}${process.env.SHUFTI_PRO_SECRET_KEY}`).digest('hex')

  return hash === signature
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
