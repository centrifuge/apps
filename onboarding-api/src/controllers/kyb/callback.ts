import { Request, Response } from 'express'
import { onboardingBucket, OnboardingUser, validateAndWriteToFirestore } from '../../database'
import { sendDocumentsMessage } from '../../emails/sendDocumentsMessage'
import { sendVerifiedBusinessMessage } from '../../emails/sendVerifiedBusinessMessage'
import { reportHttpError } from '../../utils/httpError'
import { shuftiProRequest } from '../../utils/shuftiProRequest'
import { Subset } from '../../utils/types'
const crypto = require('crypto')

type VerificationState = 1 | 0 | null

type RequestBody = {
  reference: `KYB_${string}`
  event:
    | `request.${'pending' | 'timeout' | 'deleted' | 'received'}`
    | 'review.pending'
    | `verification.${'accepted' | 'declined' | 'cancelled' | 'status.changed'}`
  verification_url: `https://app.shuftipro.com/verification/process/${string}`
  email: string
  country: string // todo import => RESIDENCY_COUNTRY_CODES

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

export const KYBCallbackController = async (req: Request<any, any, RequestBody, any>, res: Response) => {
  try {
    const { headers, body, query } = req

    const isValidRequest = headers.signature && isValidShuftiRequest(body, headers.signature)

    if (!isValidRequest || body.event !== 'verification.status.changed' || !query.address || !query.network) {
      return res.status(200).end()
    }

    const status: RequestBody = await shuftiProRequest(
      req,
      { reference: body.reference },
      { path: 'status', dryRun: false }
    )

    if (status.event === 'verification.declined') {
      // send mail to user, inform them on rejection

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

    const wallet: Request['wallet'] = {
      address: query.address,
      network: query.network,
    }

    await validateAndWriteToFirestore(wallet, updatedUser, 'entity', ['globalSteps.verifyBusiness'])
    await sendVerifiedBusinessMessage(body.email, query.poolId, query.trancheId)

    if (query.poolId && query.trancheId) {
      const signedAgreement = await fetchSignedAgreement(wallet, query.poolId, query.trancheId)

      if (!signedAgreement) {
        // send message to slack or mail to dev
        return
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
  const test = Uint8Array.from(pdf[0])
  console.log('test', test)
  return null
  // return Uint8Array.from(pdf[0])
}
