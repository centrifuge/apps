import { Injectable, Logger } from '@nestjs/common'
import { Cron, CronExpression } from '@nestjs/schedule'
import { KycStatusLabel, Tranche } from 'src/controllers/types'
import { Agreement, AgreementRepo } from '../repos/agreement.repo'
import { KycEntity, KycRepo } from '../repos/kyc.repo'
import { DocusignService } from './docusign.service'
import { SecuritizeService } from './kyc/securitize.service'
import { PoolService } from './pool.service'

@Injectable()
export class SyncService {
  private readonly logger = new Logger(SyncService.name)

  constructor(
    private readonly kycRepo: KycRepo,
    private readonly agreementRepo: AgreementRepo,
    private readonly securitizeService: SecuritizeService,
    private readonly docusignService: DocusignService,
    private readonly poolService: PoolService
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
        this.whitelist(agreement.userId, agreement.poolId, agreement.tranche)
      }
    })
  }

  private async whitelist(userId, poolId?: string, tranche?: Tranche) {
    const kyc = await this.kycRepo.find(userId)
    if (!kyc.verifiedAt || kyc.status !== 'verified') return

    // If tranche is supplied, whitelist just for that tranche. Otherwise, try to whitelist for both
    const tranches = [tranche] || ['senior', 'junior']
    tranches.forEach(async (t: Tranche) => {
      // If poolId is supplied, whitelist just for that pool. Otherwise, try to whitelist for all pools
      const poolIds = [poolId] || (await this.poolService.getIds())

      poolIds.forEach(async (poolId: string) => {
        const agreements = await this.agreementRepo.findByUserPoolTranche(userId, poolId, t)
        const done = agreements.every((agreement: Agreement) => agreement.signedAt && agreement.counterSignedAt)
        if (done) this.logger.debug(`Whitelist ${userId} for ${t} of pool ${poolId}`)
      })
    })
  }

  async syncInvestorBalances() {}
}
