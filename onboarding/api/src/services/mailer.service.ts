import { Injectable } from '@nestjs/common'
import config from '../config'
import { User } from '../repos/user.repo'

const fetch = require('@vercel/fetch-retry')(require('node-fetch'))

@Injectable()
export class MailerService {
  async sendWhitelistedEmail(user: User, pool: any, data: any) {
    const issuerName = pool.profile?.issuer?.name.replace(/\s+/g, '-').toLowerCase()
    const response = await fetch(config.sendgrid.apiUrl, {
      body: JSON.stringify({
        from: {
          name: pool.profile?.issuer?.name,
          email: `issuer+${issuerName}@centrifuge.io`,
        },
        personalizations: [
          {
            to: [{ email: user.email }],
            dynamic_template_data: {
              investorName: user.fullName,
              poolName: pool.metadata?.name,
              token: `${pool.metadata?.name} ${data.tranche}`,
              issuerName: pool.profile?.issuer?.name,
              issuerEmail: pool.profile?.issuer?.email,
            },
          },
        ],
        template_id: config.sendgrid.whitelistEmailTemplate,
      }),
      headers: {
        Authorization: `Bearer ${config.sendgrid.apiKey}`,
        'Content-Type': 'application/json',
      },
      method: 'POST',
    })
  }

  async sendSubscriptionAgreementEmail(user: User, pool: any, tranche: string) {
    const issuerName = pool.profile?.issuer?.name.replace(/\s+/g, '-').toLowerCase()
    const response = await fetch(config.sendgrid.apiUrl, {
      body: JSON.stringify({
        from: {
          name: pool.profile?.issuer?.name,
          email: `issuer+${issuerName}@centrifuge.io`,
        },
        personalizations: [
          {
            to: [{ email: user.email }],
            dynamic_template_data: {
              investorName: user.fullName,
              token: `${pool.metadata?.name} ${tranche}`,
              issuerName: pool.profile?.issuer?.name,
            },
          },
        ],
        template_id: config.sendgrid.subscriptionAgreementTemplate,
      }),
      headers: {
        Authorization: `Bearer ${config.sendgrid.apiKey}`,
        'Content-Type': 'application/json',
      },
      method: 'POST',
    }).catch((e) => {
      console.log('Error in sending email', e)
    })
  }
}

export default MailerService
