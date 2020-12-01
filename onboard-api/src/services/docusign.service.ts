import { Injectable } from '@nestjs/common'
import fetch from 'node-fetch'
import { User } from '../repos/user.repo'
import { DocusignAuthService } from './docusign-auth.service'

const InvestorRoleName = 'Investor'
const IssuerRoleName = 'Issuer'

@Injectable()
export class DocusignService {
  constructor(private readonly docusignAuthService: DocusignAuthService) {}

  async createAgreement(userId: string, email: string, templateId: string): Promise<string> {
    const envelopeDefinition = {
      templateId: templateId,
      templateRoles: [
        {
          email,
          name: 'Investor 1',
          roleName: InvestorRoleName,
          clientUserId: userId,
          routingOrder: 1,
        },
        {
          email: 'jeroen+issuer@centrifuge.io',
          name: 'Issuer 1',
          roleName: IssuerRoleName,
          routingOrder: 2,
        },
      ],
      status: 'sent',
    }

    const url = `${process.env.DOCUSIGN_REST_API_HOST}/restapi/v2.1/accounts/${process.env.DOCUSIGN_ACCOUNT_ID}/envelopes?change_routing_order=true`

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

  async getAgreementLink(envelopeId: string, user: User, returnUrl?: string): Promise<string> {
    const url = `${process.env.DOCUSIGN_REST_API_HOST}/restapi/v2.1/accounts/${process.env.DOCUSIGN_ACCOUNT_ID}/envelopes/${envelopeId}/views/recipient`

    // TODO: email and userName here should be taken from Securitize
    const recipientViewRequest = {
      authenticationMethod: 'none',
      email: user.email,
      userName: 'Investor 1',
      roleName: InvestorRoleName,
      clientUserId: user.id,
      returnUrl: returnUrl || 'https://tinlake.centrifuge.io/',
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
    const url = `${process.env.DOCUSIGN_REST_API_HOST}/restapi/v2.1/accounts/${process.env.DOCUSIGN_ACCOUNT_ID}/envelopes/${envelopeId}/recipients`

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
