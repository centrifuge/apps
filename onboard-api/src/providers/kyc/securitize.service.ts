import { Injectable } from '@nestjs/common'
import fetch from 'node-fetch'

// TODO: move this somewhere else
export interface KYCInfo {
  providerId: string
  provider: string
  authTokens: object
}

export interface SecuritizeKYCInfo extends KYCInfo {
  provider: 'securitize'
  authTokens: {
    accessToken: string
    refreshToken: string
    expiration: string
  }
}

@Injectable()
export class SecuritizeService {
  getAuthorizationLink(address: string): string {
    const scope = `info%20details%20verification`
    const redirectUrl = `http://localhost:3100/authorization/${address}/callback/securitize`
    const url = `https://id.sandbox.securitize.io/#/authorize?issuerId=${process.env.SECURITIZE_CLIENT_ID}&scope=${scope}&redirecturl=${redirectUrl}`

    return url
  }

  async processAuthorizationCallback(address: string, code: string): Promise<SecuritizeKYCInfo> {
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
      providerId: content.investorId,
      provider: 'securitize',
      authTokens: {
        accessToken: content.accessToken,
        refreshToken: content.refreshToken,
        expiration: content.expiration,
      },
    }
  }

  async getInvestor(accessToken: string): Promise<any> {
    const url = `${process.env.SECURITIZE_API_HOST}v1/${process.env.SECURITIZE_CLIENT_ID}/investor`

    const response = await fetch(url, {
      headers: {
        'access-token': accessToken,
        Authorization: `${process.env.SECURITIZE_SECRET}`,
      },
    })

    return await response.json()
  }
}
