import { Injectable, Logger } from '@nestjs/common'
import config from '../config'
import { User } from '../repos/user.repo'

const client = require('@sendgrid/mail')
client.setApiKey(config.sendgrid.apiKey)

@Injectable()
export class MailerService {
  private readonly logger = new Logger(MailerService.name)

  async sendWhitelistedEmail(user: User, pool: any, data: any) {
    this.logger.log('Sending whitelisted email')
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
        },
      ],
      from: {
        name: pool.profile?.issuer?.name,
        email: `issuer+${issuerName}@centrifuge.io`,
      },
      template_id: config.sendgrid.whitelistEmailTemplate,
    }
    try {
      await client.send(message)
      this.logger.log('Mail sent successfully')
    } catch (e) {
      this.logger.error(JSON.stringify(e))
    }
  }

  async sendSubscriptionAgreementEmail(user: User, pool: any, tranche: string) {
    this.logger.log('Sending subscription agreement signed email')

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
        email: `issuer+${pool.metadata?.slug}@centrifuge.io`,
      },
      template_id: config.sendgrid.subscriptionAgreementTemplate,
    }
    try {
      await client.send(message)
      this.logger.log('Mail sent successfully')
    } catch (e) {
      this.logger.error(JSON.stringify(e))
    }
  }

  async sendKycStatusEmail(investorName: string, investorEmail: string, status: string) {
    this.logger.log(`Sending KYC status email to ${investorName}`)

    let template_id

    if (status == 'rejected') {
      template_id = config.sendgrid.kycRejectedTemplate
    }
    if (status == 'manual-review') {
      template_id = config.sendgrid.kycManualReviewTemplate
    }
    if (status == 'expired') {
      template_id = config.sendgrid.kycExpiredTemplate
    }
    if (!template_id) return //only sending rejected, manual-review & expired emails for now

    const message = {
      personalizations: [
        {
          to: [
            {
              email: investorEmail,
              name: investorName,
            },
          ],
          dynamic_template_data: {
            investorName: investorName,
          },
        },
      ],
      from: {
        name: `Centrifuge`,
        email: `onboarding@centrifuge.io`,
      },
      template_id,
    }
    try {
      await client.send(message)
      this.logger.log('KYC status mail sent successfully')
    } catch (e) {
      this.logger.error(JSON.stringify(e))
    }
  }

  async sendAgreementVoidedEmail(user: User, pool: any, data: any, status: string) {
    this.logger.log('Sending agreement voided/declined email')
    let templateId
    if (status === 'declined') {
      templateId = config.sendgrid.subscriptionAgreementDeclined
    } else {
      templateId = config.sendgrid.subscriptionAgreementVoided
    }
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
        },
      ],
      from: {
        name: `Centrifuge`,
        email: `onboarding@centrifuge.io`,
      },
      template_id: config.sendgrid.subscriptionAgreementVoided,
    }
    try {
      await client.send(message)
      this.logger.log('Mail sent successfully')
    } catch (e) {
      this.logger.error(JSON.stringify(e))
    }
  }
}

export default MailerService
