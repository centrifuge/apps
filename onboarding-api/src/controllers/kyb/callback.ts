import { Request, Response } from 'express'

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
  console.log('KYBCallbackController request', req.body)

  // when status of one document is manually changed
  // req.body -> {
  //   reference: '',
  //   event: 'verification.status.changed'
  // }

  // make shufti status request
  // docs: https://api.shuftipro.com/api/docs/?javascript#status-request

  const { body } = req

  return res.status(200).end()
  // return res.send({})
}
