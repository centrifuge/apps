import { Injectable } from '@nestjs/common'
import { DatabaseService } from 'src/repos/db.service'
import config from '../config'
import { User } from '../repos/user.repo'
import { DocusignAuthService } from './docusign-auth.service'
import { SecuritizeService } from './kyc/securitize.service'
import { PoolService } from './pool.service'
import { getPrefilledTabs } from './templateTabs'

const fetch = require('@vercel/fetch-retry')(require('node-fetch'))

export const InvestorRoleName = 'Investor'
export const IssuerRoleName = 'Self'

@Injectable()
export class DocusignService {
  constructor(
    private readonly docusignAuthService: DocusignAuthService,
    private readonly poolService: PoolService,
    private readonly securitizeService: SecuritizeService,
    private readonly db: DatabaseService
  ) {}

  async createAgreement(
    poolId: string,
    userId: string,
    fullName: string,
    email: string,
    templateId: string
  ): Promise<string> {
    const pool = await this.poolService.get(poolId)
    if (!pool) throw new Error(`Failed to find pool ${poolId}`)

    const investor = {
      fullName: 'Satoshi Nakamoto',
      email: 'satoshi@nakamoto.com',
      verificationStatus: 'verified',
      details: {
        address: {
          countryCode: 'US',
          city: 'Los Angeles',
          entrance: '',
          state: 'CA',
          street: '123 Bitcoin Way',
          zip: '42069',
        },
        birthday: '1990-01-01T00:00:00.000Z',
      },
      domainInvestorDetails: {
        taxInfo: [
          {
            taxId: '123456789',
            taxCountryCode: 'US',
          },
        ],
      },
    }

    const envelopeDefinition = {
      templateId: '98cc99ff-8154-4e4c-a500-ba813e8d2a87',
      templateRoles: [
        {
          email,
          name: fullName,
          roleName: InvestorRoleName,
          clientUserId: userId,
          routingOrder: 1,
          tabs: getPrefilledTabs('98cc99ff-8154-4e4c-a500-ba813e8d2a87', investor),
        },
        {
          email: pool.profile.issuer.email,
          name: pool.profile.issuer.name,
          roleName: IssuerRoleName,
          routingOrder: 2,
        },
      ],
      status: 'sent',
    }

    const url = `${config.docusign.restApiHost}/restapi/v2.1/accounts/${config.docusign.accountId}/envelopes?change_routing_order=true`

    const accessToken = await this.docusignAuthService.getAccessToken()
    const response = await fetch(url, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${accessToken}`,
      },
      body: JSON.stringify(envelopeDefinition),
    })

    const content = await response.json()

    if (response.status !== 201) {
      throw new Error(`Failed to create envelope: ${content.errorCode} - ${content.message}`)
    }

    return content.envelopeId
  }

  async getAgreementLink(envelopeId: string, user: User, returnUrl: string): Promise<string> {
    const url = `${config.docusign.restApiHost}/restapi/v2.1/accounts/${config.docusign.accountId}/envelopes/${envelopeId}/views/recipient`

    const recipientViewRequest = {
      authenticationMethod: 'none',
      email: user.email,
      userName: user.entityName?.length > 0 ? user.entityName : user.fullName,
      roleName: InvestorRoleName,
      clientUserId: user.id,
      returnUrl,
    }

    const accessToken = await this.docusignAuthService.getAccessToken()

    const response = await fetch(url, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${accessToken}`,
      },
      body: JSON.stringify(recipientViewRequest),
    })

    const content = await response.json()

    if (response.status !== 201) {
      throw new Error(`Failed to create recipient view: ${content.errorCode} - ${content.message}`)
    }

    return content.url
  }

  async getEnvelopeStatus(envelopeId: string): Promise<AgreementStatus> {
    const url = `${config.docusign.restApiHost}/restapi/v2.1/accounts/${config.docusign.accountId}/envelopes/${envelopeId}/recipients`

    const accessToken = await this.docusignAuthService.getAccessToken()
    const response = await fetch(url, {
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${accessToken}`,
      },
    })

    const content = await response.json()
    const investor = content.signers.find((signer: any) => signer.roleName === InvestorRoleName)
    const issuer = content.signers.find((signer: any) => signer.roleName === IssuerRoleName)

    return {
      signed: investor?.status === 'completed',
      counterSigned: issuer?.status === 'completed',
    }
  }
}

export interface AgreementStatus {
  signed: boolean
  counterSigned: boolean
}
