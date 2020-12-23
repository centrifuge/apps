import { Injectable } from '@nestjs/common'
const fetch = require('@vercel/fetch-retry')(require('node-fetch'))

export interface SecuritizeKYCInfo {
  providerAccountId: string
  digest: {
    accessToken: string
    refreshToken: string
    expiration: string
  }
}

@Injectable()
export class SecuritizeService {
  getAuthorizationLink(poolId: string, address: string): string {
    const scope = `info%20details%20verification`
    const redirectUrl = `${process.env.ONBOARD_API_HOST}pools/${poolId}/callback/${address}/securitize`
    const url = `${process.env.SECURITIZE_ID_HOST}#/authorize?issuerId=${process.env.SECURITIZE_CLIENT_ID}&scope=${scope}&redirecturl=${redirectUrl}`

    return url
  }

  async processAuthorizationCallback(code: string): Promise<SecuritizeKYCInfo> {
    const url = `${process.env.SECURITIZE_API_HOST}v1/${process.env.SECURITIZE_CLIENT_ID}/oauth2/authorize`

    const response = await fetch(url, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `${process.env.SECURITIZE_SECRET}`,
      },
      body: JSON.stringify({ code }),
    })

    const content = await response.json()

    return {
      providerAccountId: content.investorId,
      digest: {
        accessToken: content.accessToken,
        refreshToken: content.refreshToken,
        expiration: content.expiration,
      },
    }
  }

  // TODO: implement support for refreshing the access token
  async getInvestor(accessToken: string): Promise<Investor> {
    const url = `${process.env.SECURITIZE_API_HOST}v1/${process.env.SECURITIZE_CLIENT_ID}/investor`

    const response = await fetch(url, {
      headers: {
        'access-token': accessToken,
        Authorization: `${process.env.SECURITIZE_SECRET}`,
      },
    })

    const investor = await response.json()
    return investor
  }
}

export interface Investor {
  investorId: string
  createDate: string
  fullName: string
  tfaEnabled: boolean
  language: string
  email: string
  verificationStatus: string
  details: {
    tax: any[]
    address: {
      countryCode: string
    }
  }
}
