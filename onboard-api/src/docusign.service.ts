import { Injectable } from '@nestjs/common'

const { DOCUSIGN_BASE_PATH, DOCUSIGN_ACCESS_TOKEN, DOCUSIGN_TEMPLATE_ID, DOCUSIGN_ACCOUNT_ID } = process.env

@Injectable()
export class DocusignService {
  async sendSubscriptionAgreement(): Promise<any> {
    try {
      const envelopeId = await this.createEnvelope()
      const embedUrl = await this.createRecipientView(envelopeId)

      return {
        statusCode: 200,
        body: embedUrl,
      }
    } catch (e) {
      console.error(e)
      return {
        statusCode: 500,
        body: e.message,
      }
    }
  }

  private async createEnvelope(): Promise<string> {
    const envelopeDefinition = {
      // templateId: DOCUSIGN_TEMPLATE_ID,
      templateRoles: [
        {
          email: 'jeroen+signer@centrifuge.io',
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
      compositeTemplates: [
        {
          serverTemplates: [
            {
              sequence: 1,
              templateId: DOCUSIGN_TEMPLATE_ID,
            },
          ],
          inlineTemplates: [
            {
              sequence: 2,
              recipients: {
                signers: [
                  {
                    recipientId: 1,
                    email: 'jeroen+signer@centrifuge.io',
                    name: 'Investor',
                    roleName: 'signer',
                    clientUserId: '0',
                    tabs: {
                      textTabs: [
                        {
                          tabLabel: 'name1',
                          value: 'Some Prefilled Name',
                        },
                      ],
                    },
                  },
                  {
                    recipientId: 2,
                    email: 'jeroen+cc@centrifuge.io',
                    name: 'Centrifuge',
                    roleName: 'cc',
                  },
                ],
              },
            },
          ],
        },
      ],
      status: 'sent',
    }

    const url = `${DOCUSIGN_BASE_PATH}/restapi/v2.1/accounts/${DOCUSIGN_ACCOUNT_ID}/envelopes`

    const response = await fetch(url, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${DOCUSIGN_ACCESS_TOKEN}`,
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
    const url = `${DOCUSIGN_BASE_PATH}/restapi/v2.1/accounts/${DOCUSIGN_ACCOUNT_ID}/envelopes/${envelopeId}/views/recipient`

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
        Authorization: `Bearer ${DOCUSIGN_ACCESS_TOKEN}`,
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
