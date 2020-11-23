import { Injectable } from '@nestjs/common'

@Injectable()
export class SecuritizeService {
  getAuthorizationLink(): string {
    console.log('process in SecuritizeService', process.env)
    const scope = `info%20details%20verification`
    const redirectUrl = 'http://localhost:3100/authorization/callback/securitize'
    const url = `https://id.sandbox.securitize.io/#/authorize?issuerId=${process.env.SECURITIZE_CLIENT_ID}&scope=${scope}&redirecturl=${redirectUrl}`

    return url
  }

  async processAuthorizationCallback(query: { code: string }): Promise<any> {
    const url = `${process.env.SECURITIZE_API_HOST}v1/${process.env.SECURITIZE_CLIENT_ID}/oauth2/authorize`

    const response = await fetch(url, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `${process.env.SECURITIZE_SECRET}`,
      },
      body: JSON.stringify({ code: query.code }),
    })

    const content = await response.json()
    console.log({ content })

    return content
  }
}
