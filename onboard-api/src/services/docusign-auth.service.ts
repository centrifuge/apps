import { JwtUtils } from '@connectedcars/jwtutils'
import { Injectable, Logger } from '@nestjs/common'
import config from '../config'
const fetch = require('@vercel/fetch-retry')(require('node-fetch'))

const HourInSeconds = 60 * 60
const HourInMilliseconds = HourInSeconds * 1000

@Injectable()
export class DocusignAuthService {
  private readonly logger = new Logger(DocusignAuthService.name)

  accessToken: string | undefined = undefined
  expiresAt: number | undefined = undefined

  getAuthorizationLink(): string {
    return `${config.docusign.accountApiHost}oauth/auth?response_type=code&scope=signature%20impersonation&client_id=${config.docusign.integrationKey}&redirect_uri=${config.onboardApiHost}docusign/callback`
  }

  async getAccessToken(): Promise<string> {
    const hasExpired = this.expiresAt && Date.now() >= this.expiresAt - 60 * 1000 // Substract 1min buffer (so refresh the access token 1 min before it expires)
    if (!this.accessToken || hasExpired) {
      return this.createAccessToken()
    }

    return this.accessToken
  }

  async getUserInfo(): Promise<any> {
    const accessToken = await this.getAccessToken()

    const response = await fetch(`${config.docusign.accountApiHost}oauth/userinfo`, {
      headers: {
        Authorization: `Bearer ${accessToken}`,
      },
    })

    return await response.json()
  }

  private async createAccessToken(): Promise<string> {
    const jwt = this.getJWT()

    const response = await fetch(`${config.docusign.accountApiHost}oauth/token`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ grant_type: 'urn:ietf:params:oauth:grant-type:jwt-bearer', assertion: jwt }),
    })

    const data = await response.json()

    this.accessToken = data['access_token']
    this.expiresAt = Date.now() + data['expires_in'] * 1000

    return this.accessToken
  }

  private getJWT(): string {
    const header = {
      alg: 'RS256',
      typ: 'JWT',
    }

    const unixNow = Math.floor(Date.now() / 1000)

    const body = {
      iss: config.docusign.integrationKey,
      sub: config.docusign.apiUsername,
      aud: new URL(config.docusign.accountApiHost).hostname,
      iat: unixNow,
      exp: unixNow + HourInSeconds,
      scope: 'signature impersonation',
    }

    const privateKey = config.docusign.rsaPrivateKey.replace(/\\n/g, '\n')
    const jwt = JwtUtils.encode(privateKey, header, body)

    return jwt
  }
}
