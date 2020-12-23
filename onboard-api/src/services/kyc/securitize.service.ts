import { Injectable } from '@nestjs/common'
import config from '../../config'
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
    const redirectUrl = `${config.onboardApiHost}pools/${poolId}/callback/${address}/securitize`
    const url = `${config.securitize.idHost}#/authorize?issuerId=${config.securitize.clientId}&scope=${scope}&redirecturl=${redirectUrl}`

    return url
  }

  async processAuthorizationCallback(code: string): Promise<SecuritizeKYCInfo> {
    const url = `${config.securitize.apiHost}v1/${config.securitize.clientId}/oauth2/authorize`

    const response = await fetch(url, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `${config.securitize.secret}`,
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
    const url = `${config.securitize.apiHost}v1/${config.securitize.clientId}/investor`

    const response = await fetch(url, {
      headers: {
        'access-token': accessToken,
        Authorization: `${config.securitize.secret}`,
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
