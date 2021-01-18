import { Injectable, Logger } from '@nestjs/common'
import config from '../../config'
import { KycEntity, KycRepo } from '../../repos/kyc.repo'
const fetch = require('@vercel/fetch-retry')(require('node-fetch'))

export interface SecuritizeDigest {
  accessToken: string
  refreshToken: string
  expiration: string
}

export interface SecuritizeKYCInfo {
  providerAccountId: string
  digest: SecuritizeDigest
}

@Injectable()
export class SecuritizeService {
  private readonly logger = new Logger(SecuritizeService.name)

  constructor(private readonly kycRepo: KycRepo) {}

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

  // dontRefresh is to prevent a recursive loop when the investor request keeps failing despite the access token being refreshed
  async getInvestor(
    userId: string,
    providerAccountId: string,
    digest: SecuritizeDigest,
    dontRefresh?: boolean
  ): Promise<Investor | undefined> {
    const url = `${config.securitize.apiHost}v1/${config.securitize.clientId}/investor`

    const response = await fetch(url, {
      headers: {
        'access-token': digest.accessToken,
        Authorization: `${config.securitize.secret}`,
      },
    })

    if (!dontRefresh && response.status === 401) {
      // Access token has expired
      const newDigest = await this.refreshAccessToken(digest.refreshToken)
      if (!newDigest) {
        this.logger.warn(`Failed to refresh access token for ${userId}`)
        return undefined
      }

      this.kycRepo.upsertSecuritize(userId, providerAccountId, newDigest)
      return this.getInvestor(userId, providerAccountId, newDigest, true)
    }

    const investor = await response.json()
    return investor
  }

  private async refreshAccessToken(refreshToken: string): Promise<SecuritizeDigest | undefined> {
    const url = `${config.securitize.apiHost}v1/${config.securitize.clientId}/oauth2/refresh`

    const response = await fetch(url, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `${config.securitize.secret}`,
      },
      body: JSON.stringify({ refreshToken }),
    })

    if (response.status === 401) {
      // Refresh token has also expired
      return undefined
    }

    const content = await response.json()
    return {
      accessToken: content.accessToken,
      refreshToken: content.refreshToken,
      expiration: content.expiration,
    }
  }
}

export interface Investor {
  investorId: string
  createDate: string
  fullName: string
  tfaEnabled: boolean
  language: string
  email: string
  verificationStatus: 'none' | 'processing' | 'updates-required' | 'verified' | 'manual-review' | 'rejected' | 'expired'
  details: {
    firstName?: string
    middleName?: string
    lastName?: string
    tax: any[]
    address?: {
      countryCode?: string
    }
  }
  domainInvestorDetails: {
    taxInfo: any
    isUsaTaxResident: boolean
    isAccredited: boolean
    investorFullName?: string
    entityName?: string
  }
}
