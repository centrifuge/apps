import { Request, Response } from 'express'
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
  const { headers, body } = req

  if (headers.signature) {
    const isValidRequest = isValidShuftiRequest(body, headers.signature)
    console.log('isValidRequest', isValidRequest)
  }

  return res.status(200).end()
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
