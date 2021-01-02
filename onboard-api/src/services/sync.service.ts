import { Injectable, Logger } from '@nestjs/common'
import { Cron, CronExpression } from '@nestjs/schedule'
import { KycEntity, KycRepo } from '../repos/kyc.repo'
import { SecuritizeService } from './kyc/securitize.service'

@Injectable()
export class SyncService {
  private readonly logger = new Logger(SyncService.name)

  constructor(private readonly kycRepo: KycRepo, private readonly securitizeService: SecuritizeService) {}

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

  // TODO: syncAgreementStatus
}
