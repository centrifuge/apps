import config from '../config'
import { User } from '../repos/user.repo'

export class Mailer {
  async sendEmail(user: User, pool: any) {
    const response = await fetch(config.sendgrid.apiUrl, {
      body: JSON.stringify({
        from: {
          name: 'Tinlake pools',
          email: `issuer+${pool.profile.issuer.name}@tinlake.com`,
        },
        personalizations: [
          {
            to: [user.email],
            dynamic_template_data: {
              investorName: user.fullName,
              poolName: pool.metadata.name,
              token: 'DROP',
              issuerName: pool.profile.issuer.name,
              issuerEmail: pool.profile.issuer.email,
            },
          },
        ],
        template_id: config.sendgrid.templateId,
      }),
      headers: {
        Authorization: `Bearer ${config.sendgrid.apiKey}`,
        'Content-Type': 'application/json',
      },
      method: 'POST',
    })
  }
}

export default Mailer
