import { Injectable } from '@nestjs/common'
import config from '../config'
import { User } from '../repos/user.repo'

const client = require('@sendgrid/mail')
client.setApiKey(config.sendgrid.apiKey)

@Injectable()
export class MailerService {
  async sendWhitelistedEmail(user: User, pool: any, data: any) {
    const issuerName = pool.profile?.issuer?.name.replace(/\s+/g, '-').toLowerCase()
    const message = {
      personalizations: [
        {
          to: [
            {
              email: user.email,
              name: user.fullName,
            },
          ],
          dynamic_template_data: {
            investorName: user.fullName,
            poolName: pool.metadata?.name,
            token: `${pool.metadata?.name} ${data.tranche}`,
            issuerName: pool.profile?.issuer?.name,
            issuerEmail: pool.profile?.issuer?.email,
          },
          headers: {
            'Content-Type': 'text/html',
          },
        },
      ],
      from: {
        name: pool.profile?.issuer?.name,
        email: `issuer+${issuerName}@centrifuge.io`,
      },
      template_id: config.sendgrid.whitelistEmailTemplate,
    }

    await client
      .send(message)
      .then(() => console.log('Subscription email sent successfully'))
      .catch((error) => {
        console.error(error)
      })
  }

  async sendSubscriptionAgreementEmail(user: User, pool: any, tranche: string) {
    const issuerName = pool.profile?.issuer?.name.replace(/\s+/g, '-').toLowerCase()
    const message = {
      personalizations: [
        {
          to: [
            {
              email: user.email,
              name: user.fullName,
            },
          ],
          dynamic_template_data: {
            investorName: user.fullName,
            token: `${pool.metadata?.slug} ${tranche}`,
            issuerName: pool.profile?.issuer?.name,
          },
        },
      ],
      from: {
        name: pool.profile?.issuer?.name,
        email: `issuer+${issuerName}@centrifuge.io`,
      },
      template_id: config.sendgrid.subscriptionAgreementTemplate,
    }

    await client
      .send(message)
      .then(() => console.log('Mail sent successfully'))
      .catch((error) => {
        console.error(JSON.stringify(error))
      })
  }
}

export default MailerService
