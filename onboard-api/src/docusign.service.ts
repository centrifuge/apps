import { Injectable } from '@nestjs/common'
import fetch from 'node-fetch'

@Injectable()
export class DocusignService {
  async getAgreementURL(email: string): Promise<string> {
    const envelopeId = await this.createEnvelope(email)
    const embedUrl = await this.createRecipientView(envelopeId)

    return embedUrl
  }

  private async createEnvelope(email: string): Promise<string> {
    const envelopeDefinition = {
      templateId: process.env.DOCUSIGN_TEMPLATE_ID,
      templateRoles: [
        {
          email,
          name: 'Investor',
          roleName: 'signer',
          clientUserId: 'something',
        },
        {
          email: 'jeroen+cc@centrifuge.io',
          name: 'Centrifuge',
          roleName: 'cc',
        },
      ],
      status: 'sent',
    }

    const url = `${process.env.DOCUSIGN_BASE_PATH}/restapi/v2.1/accounts/${process.env.DOCUSIGN_ACCOUNT_ID}/envelopes`

    const response = await fetch(url, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${process.env.DOCUSIGN_ACCESS_TOKEN}`,
      },
      body: JSON.stringify(envelopeDefinition),
    })

    const content = await response.json()

    if (response.status !== 201) {
      throw new Error(`Failed to create envelope: ${content.errorCode} - ${content.message}`)
    }

    return content.envelopeId
  }

  private async createRecipientView(envelopeId: string): Promise<string> {
    const url = `${process.env.DOCUSIGN_BASE_PATH}/restapi/v2.1/accounts/${process.env.DOCUSIGN_ACCOUNT_ID}/envelopes/${envelopeId}/views/recipient`

    const recipientViewRequest = {
      authenticationMethod: 'none',
      email: 'jeroen+signer@centrifuge.io',
      userName: 'Investor',
      returnUrl: 'https://tinlake.centrifuge.io/',
    }

    const response = await fetch(url, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${process.env.DOCUSIGN_ACCESS_TOKEN}`,
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
