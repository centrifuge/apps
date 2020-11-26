import { Injectable } from '@nestjs/common'
import fetch from 'node-fetch'

import { DocusignAuthService } from './docusign-auth.service'

@Injectable()
export class DocusignService {
  constructor(private readonly docusignAuthService: DocusignAuthService) {}

  async createAgreement(email: string, templateId: string): Promise<string> {
    const envelopeDefinition = {
      templateId: templateId,
      templateRoles: [
        {
          email,
          name: 'Investor',
          roleName: 'signer',
          clientUserId: 'something',
          routingOrder: 1,
        },
        {
          email: 'jeroen+cc@centrifuge.io',
          name: 'Centrifuge',
          roleName: 'cc',
          routingOrder: 2,
        },
      ],
      status: 'sent',
    }

    const url = `${process.env.DOCUSIGN_REST_API_HOST}/restapi/v2.1/accounts/${process.env.DOCUSIGN_ACCOUNT_ID}/envelopes`

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

  async getAgreementLink(envelopeId: string): Promise<string> {
    const url = `${process.env.DOCUSIGN_REST_API_HOST}/restapi/v2.1/accounts/${process.env.DOCUSIGN_ACCOUNT_ID}/envelopes/${envelopeId}/views/recipient`

    const recipientViewRequest = {
      authenticationMethod: 'none',
      email: 'jeroen+signer@centrifuge.io',
      userName: 'Investor',
      returnUrl: 'https://tinlake.centrifuge.io/',
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
}
