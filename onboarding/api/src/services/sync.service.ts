import { Injectable, Logger } from '@nestjs/common'
import { Cron, CronExpression } from '@nestjs/schedule'
import { AgreementRepo } from '../repos/agreement.repo'
import { KycEntity, KycRepo } from '../repos/kyc.repo'
import { UserRepo } from '../repos/user.repo'
import { DocusignService } from './docusign.service'
import { SecuritizeService } from './kyc/securitize.service'
import { MemberlistService } from './memberlist.service'

@Injectable()
export class SyncService {
  private readonly logger = new Logger(SyncService.name)

  constructor(
    private readonly kycRepo: KycRepo,
    private readonly agreementRepo: AgreementRepo,
    private readonly securitizeService: SecuritizeService,
    private readonly docusignService: DocusignService,
    private readonly memberlistService: MemberlistService,
    private readonly userRepo: UserRepo
  ) {}

  @Cron(CronExpression.EVERY_5_MINUTES)
  async syncKycStatus() {
    const processingInvestors = await this.kycRepo.getProcessingInvestors()
    if (processingInvestors.length === 0) return

    this.logger.debug(`Syncing ${processingInvestors.length} investors`)
    processingInvestors.forEach(async (kyc: KycEntity) => {
      const investor = await this.securitizeService.getInvestor(kyc.userId, kyc.providerAccountId, kyc.digest)

      if (!investor) {
        this.logger.warn(`Failed to retrieve investor ${kyc.userId}`)
        return
      }

      await this.userRepo.update(
        kyc.userId,
        investor.email,
        investor.details.address.countryCode,
        investor.domainInvestorDetails?.investorFullName,
        investor.domainInvestorDetails?.entityName
      )

      if (
        (investor && investor.verificationStatus !== kyc.status) ||
        investor.domainInvestorDetails.isAccredited !== kyc.accredited
      ) {
        this.logger.debug(
          `Update investor ${kyc.userId} status to ${investor.verificationStatus}${
            investor.domainInvestorDetails.isAccredited ? ' (accredited)' : ''
          }`
        )
        this.kycRepo.setStatus(
          'securitize',
          kyc.providerAccountId,
          investor.verificationStatus === 'manual-review' ? 'processing' : investor.verificationStatus,
          investor.domainInvestorDetails.isUsaTaxResident,
          investor.domainInvestorDetails.isAccredited
        )

        this.memberlistService.update(kyc.userId)
      }
    })
  }

  // This is just a backup option, it should already be covered by the Docusign Connect integration
  @Cron(CronExpression.EVERY_HOUR)
  async syncAgreementStatus() {
    const agreements = await this.agreementRepo.getAwaitingCounterSignature()
    if (agreements.length === 0) return

    this.logger.debug(`Syncing ${agreements.length} agreements`)
    // Synchronous, one by one, so the docusign access token doesn't get overwritten because multiple requests create multiple access tokens in parallel
    for (let agreement of agreements) {
      const status = await this.docusignService.getEnvelopeStatus(agreement.providerEnvelopeId)

      if (!agreement.counterSignedAt && status.counterSigned) {
        this.logger.log(`Agreement ${agreement.id} has been counter-signed`)
        this.agreementRepo.setCounterSigned(agreement.id)
        this.memberlistService.update(agreement.userId, agreement.poolId, agreement.tranche)
      }
    }
  }

  // @Cron(CronExpression.EVERY_30_MINUTES) // TODO: change to e.g. every 5 min
  // async syncWhitelistStatus() {
  // TODO: get non whitelisted, kyced, accredited, agreement signed addresses
  // TOOD: per tranche, check whitelist status
  // }

  // @Cron(CronExpression.EVERY_HOUR)
  // async syncInvestorBalances() {}
}
