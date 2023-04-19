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

const crypto = require('crypto')

export const KYBCallbackController = async (req: Request<any, any, RequestBody, any>, res: Response) => {
  const { headers, body } = req
  console.log('res: ', req.body)

  if (headers.signature) {
    const hashedSecretKey = crypto.createHash('sha256').update(SHUFTI_PRO_SECRET_KEY).digest('hex')

    const hash = crypto
      .createHash('sha256')
      // .update(`${JSON.stringify(body)}${SHUFTI_PRO_SECRET_KEY}`)
      .update(`[object Response]${SHUFTI_PRO_SECRET_KEY}`)
      .digest('hex')

    // console.log('signature: ', headers.signature)
    // console.log('hash: ', hash)
    // console.log('hash equals signature', hash === headers.signature)
  }

  return res.status(200).end()
}

const exampleRequest = {
  reference: 'KYB_0.21503711327067587',
  event: 'review.pending',
  email: 'ben@k-f.co',
  country: 'KY',
  verification_data: {},
  verification_result: {
    proof_stores: {
      articles_of_association: 1,
      certificate_of_incorporation: 1,
      proof_of_address: 1,
      register_of_directors: 1,
      register_of_shareholders: 1,
      signed_and_dated_ownership_structure: 1,
    },
  },
  info: {
    agent: {
      is_desktop: true,
      is_phone: false,
      device_name: 'Macintosh',
      browser_name: 'Chrome 111.0.0.0',
      platform_name: 'Mac OS 10.15.7',
    },
    geolocation: {
      host: '',
      ip: '85.149.0.0',
      rdns: '85.149.0.0',
      asn: '1234',
      isp: 'Lorem',
      country_name: 'Netherlands',
      country_code: 'NL',
      region_name: 'South Holland',
      region_code: 'ZH',
      city: 'Voorburg',
      postal_code: '2511',
      continent_name: 'Europe',
      continent_code: 'EU',
      latitude: '52.077980041504',
      longitude: '4.3173198699951',
      metro_code: '',
      timezone: 'Europe/Amsterdam',
      ip_type: 'ipv4',
      capital: 'Amsterdam',
      currency: 'EUR',
    },
  },
}
