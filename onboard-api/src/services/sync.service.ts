import { Injectable, Logger } from '@nestjs/common'
import { Cron, CronExpression } from '@nestjs/schedule'
import { Agreement, AgreementRepo } from '../repos/agreement.repo'
import { KycEntity, KycRepo } from '../repos/kyc.repo'
import { DocusignService } from './docusign.service'
import { SecuritizeService } from './kyc/securitize.service'

@Injectable()
export class SyncService {
  private readonly logger = new Logger(SyncService.name)

  constructor(
    private readonly kycRepo: KycRepo,
    private readonly agreementRepo: AgreementRepo,
    private readonly securitizeService: SecuritizeService,
    private readonly docusignService: DocusignService
  ) {}

  @Cron(CronExpression.EVERY_10_SECONDS) // TODO: change to e.g. every 5 min
  async syncKycStatus() {
    const processingInvestors = await this.kycRepo.getProcessingInvestors()
    if (processingInvestors.length === 0) return

    this.logger.debug(`Syncing ${processingInvestors.length} investors`)
    processingInvestors.forEach(async (kyc: KycEntity) => {
      const investor = await this.securitizeService.getInvestor(kyc.digest)
      if (investor) {
        console.log(`Investor status: ${investor.verificationStatus}`)

        if (investor.verificationStatus !== kyc.status) {
          this.logger.debug(`Update investor status`)
          // TODO
        }

        // TODO: update personal info?
      }
    })
  }

  @Cron(CronExpression.EVERY_10_SECONDS) // TODO: change to e.g. every 5 min
  async syncAgreementStatus() {
    const agreements = await this.agreementRepo.getAwaitingCounterSignature()
    this.logger.debug(`Syncing ${agreements.length} agreements`)

    // TODO: use Promise.all
    agreements.forEach(async (agreement: Agreement) => {
      const status = await this.docusignService.getEnvelopeStatus(agreement.providerEnvelopeId)
      console.log({ status })
    })
  }
}
