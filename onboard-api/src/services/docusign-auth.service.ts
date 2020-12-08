import { JwtUtils } from '@connectedcars/jwtutils'
import { Injectable, Logger } from '@nestjs/common'
const fetch = require('@vercel/fetch-retry')(require('node-fetch'))

const HourInSeconds = 60 * 60
const HourInMilliseconds = HourInSeconds * 1000

@Injectable()
export class DocusignAuthService {
  private readonly logger = new Logger(DocusignAuthService.name)

  accessToken: string | undefined = undefined
  expiresAt: number | undefined = undefined

  getAuthorizationLink(): string {
    return `${process.env.DOCUSIGN_ACCOUNT_API_HOST}oauth/auth?response_type=code&scope=signature%20impersonation&client_id=${process.env.DOCUSIGN_INTEGRATION_KEY}&redirect_uri=${process.env.ONBOARD_API_HOST}docusign/callback`
  }

  async getAccessToken(): Promise<string> {
    const hasExpired = this.expiresAt && Date.now() >= this.expiresAt + 10 * 1000 // Add 10s buffer
    if (!this.accessToken || hasExpired) return this.createAccessToken()

    this.logger.log('Re-using access token for Docusign')
    return this.accessToken
  }

  async getUserInfo(): Promise<any> {
    const accessToken = await this.getAccessToken()

    const response = await fetch(`${process.env.DOCUSIGN_ACCOUNT_API_HOST}oauth/userinfo`, {
      headers: {
        Authorization: `Bearer ${accessToken}`,
      },
    })

    return await response.json()
  }

  private async createAccessToken(): Promise<string> {
    const jwt = this.getJWT()

    const response = await fetch(`${process.env.DOCUSIGN_ACCOUNT_API_HOST}oauth/token`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ grant_type: 'urn:ietf:params:oauth:grant-type:jwt-bearer', assertion: jwt }),
    })

    const data = await response.json()

    this.accessToken = data['access_token']
    this.expiresAt = Date.now() + HourInMilliseconds

    this.logger.log('Created new access token for Docusign')

    return this.accessToken
  }

  private getJWT(): string {
    const header = {
      alg: 'RS256',
      typ: 'JWT',
    }

    const unixNow = Math.floor(Date.now() / 1000)

    const body = {
      iss: process.env.DOCUSIGN_INTEGRATION_KEY,
      sub: process.env.DOCUSIGN_API_USERNAME,
      aud: 'account-d.docusign.com',
      iat: unixNow,
      exp: unixNow + HourInSeconds,
      scope: 'signature impersonation',
    }

    const privateKey = process.env.DOCUSIGN_RSA_PRIVATE_KEY.replace(/\\n/g, '\n')
    const jwt = JwtUtils.encode(privateKey, header, body)

    return jwt
  }
}
