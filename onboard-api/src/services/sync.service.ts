import { Injectable, Logger } from '@nestjs/common'
import { Cron, CronExpression } from '@nestjs/schedule'
import { KycStatusLabel, Tranche } from 'src/controllers/types'
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

  @Cron(CronExpression.EVERY_MINUTE) // TODO: change to e.g. every 5 min
  async syncKycStatus() {
    const processingInvestors = await this.kycRepo.getProcessingInvestors()
    if (processingInvestors.length === 0) return

    this.logger.debug(`Syncing ${processingInvestors.length} investors`)
    processingInvestors.forEach(async (kyc: KycEntity) => {
      const investor = await this.securitizeService.getInvestor(kyc.digest)
      if (investor && investor.verificationStatus !== kyc.status) {
        this.logger.debug(`Update investor ${kyc.userId} status to ${investor.verificationStatus}`)
        this.kycRepo.setStatus('securitize', kyc.providerAccountId, investor.verificationStatus as KycStatusLabel)

        this.whitelist(kyc.userId)
        // TODO: update personal info?
      }
    })
  }

  @Cron(CronExpression.EVERY_MINUTE) // TODO: change to e.g. every 5 min
  async syncAgreementStatus() {
    const agreements = await this.agreementRepo.getAwaitingCounterSignature()
    this.logger.debug(`Syncing ${agreements.length} agreements`)

    // TODO: use Promise.all
    agreements.forEach(async (agreement: Agreement) => {
      const status = await this.docusignService.getEnvelopeStatus(agreement.providerEnvelopeId)

      if (!agreement.counterSignedAt && status.counterSigned) {
        console.log(`Agreement ${agreement.id} has been counter-signed`)
        this.agreementRepo.setCounterSigned(agreement.id)
        this.whitelist(agreement.userId, agreement.tranche)
      }
    })
  }

  // If tranche is supplied, whitelist just for that tranche. Otherwise, try to whitelist for both
  private async whitelist(userId, tranche?: Tranche) {
    // TODO: check kyc status and agreement status
    this.logger.debug(`Whitelist ${userId} for ${tranche || 'both tranches'}`)
  }

  // TODO: async syncInvestorBalances()
}
