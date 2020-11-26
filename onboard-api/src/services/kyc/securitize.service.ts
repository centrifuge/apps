import { Injectable } from '@nestjs/common'
import fetch from 'node-fetch'

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
  getAuthorizationLink(address: string): string {
    const scope = `info%20details%20verification`
    const redirectUrl = `http://localhost:3100/callback/${address}/securitize`
    const url = `https://id.sandbox.securitize.io/#/authorize?issuerId=${process.env.SECURITIZE_CLIENT_ID}&scope=${scope}&redirecturl=${redirectUrl}`

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
