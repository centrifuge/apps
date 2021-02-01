import { Injectable } from '@nestjs/common'
import config from '../config'
import { User } from '../repos/user.repo'
import { DocusignAuthService } from './docusign-auth.service'
import { PoolService } from './pool.service'
const fetch = require('@vercel/fetch-retry')(require('node-fetch'))

export const InvestorRoleName = 'Investor'
export const IssuerRoleName = 'Self'

@Injectable()
export class DocusignService {
  constructor(private readonly docusignAuthService: DocusignAuthService, private readonly poolService: PoolService) {}

  async createAgreement(poolId: string, userId: string, email: string, templateId: string): Promise<string> {
    const pool = await this.poolService.get(poolId)
    if (!pool) throw new Error(`Failed to find pool ${poolId}`)

    const envelopeDefinition = {
      templateId: templateId,
      templateRoles: [
        {
          email,
          name: 'Investor',
          roleName: InvestorRoleName,
          clientUserId: userId,
          routingOrder: 1,
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

    // TODO: email and userName here should be taken from Securitize
    const recipientViewRequest = {
      authenticationMethod: 'none',
      email: user.email,
      userName: 'Investor',
      roleName: InvestorRoleName,
      clientUserId: user.id,
      returnUrl: returnUrl,
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
