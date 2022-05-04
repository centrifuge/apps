import { Injectable, Logger } from '@nestjs/common'
import { Cron, CronExpression } from '@nestjs/schedule'
import { AddressRepo } from '../repos/address.repo'
import { AgreementRepo } from '../repos/agreement.repo'
import { KycEntity, KycRepo } from '../repos/kyc.repo'
import { UserRepo } from '../repos/user.repo'
import { DocusignService } from './docusign.service'
import { SecuritizeService } from './kyc/securitize.service'
import MailerService from './mailer.service'
import { MemberlistService } from './memberlist.service'

@Injectable()
export class SyncService {
  private readonly logger = new Logger(SyncService.name)
  mailer = new MailerService()

  constructor(
    private readonly kycRepo: KycRepo,
    private readonly agreementRepo: AgreementRepo,
    private readonly securitizeService: SecuritizeService,
    private readonly docusignService: DocusignService,
    private readonly memberlistService: MemberlistService,
    private readonly addressRepo: AddressRepo,
    private readonly userRepo: UserRepo
  ) {}

  @Cron(CronExpression.EVERY_2_HOURS)
  async syncKycStatus() {
    const processingInvestors = await this.kycRepo.getProcessingInvestors()
    if (processingInvestors.length === 0) return

    this.logger.debug(`Syncing ${processingInvestors.length} investors`)
    processingInvestors.forEach(async (kyc: KycEntity) => {
      const investor = await this.securitizeService.getInvestor(kyc.userId, kyc.providerAccountId, kyc.digest)

      if (!investor) {
        console.log(`Failed to retrieve investor status for user ${kyc.userId}`)
        await this.kycRepo.invalidate(kyc.provider, kyc.providerAccountId)
        return
      }

      await this.userRepo.update(
        kyc.userId,
        investor.email,
        investor.details.address.countryCode,
        investor.domainInvestorDetails?.investorFullName,
        investor.domainInvestorDetails?.entityName
      )

      // Skip manual-review because we are not saving that separately, so it will be the status processing
      if (
        (investor && investor.verificationStatus !== kyc.status && investor.verificationStatus !== 'manual-review') ||
        investor.domainInvestorDetails?.isAccredited !== kyc.accredited
      ) {
        this.logger.debug(
          `Update investor ${kyc.userId} status to ${investor.verificationStatus}${
            investor.domainInvestorDetails?.isAccredited ? ' (accredited)' : ''
          }`
        )
        this.kycRepo.setStatus(
          'securitize',
          kyc.providerAccountId,
          investor.verificationStatus === 'manual-review' ? 'processing' : investor.verificationStatus,
          investor.domainInvestorDetails?.isUsaTaxResident,
          investor.domainInvestorDetails?.isAccredited
        )

        this.memberlistService.update(kyc.userId)
      }

      //Send KYC status email if status is updated
      if (investor && investor.verificationStatus !== kyc.status) {
        if (kyc.status === 'processing' && investor.verificationStatus === 'manual-review') {
          // they're both same status. do nothing
          return
        }
        await this.mailer.sendKycStatusEmail(investor.fullName, investor.email, investor.verificationStatus)
      }
    })
  }

  // This is just a backup option, it should already be covered by the Docusign Connect integration
  @Cron(CronExpression.EVERY_DAY_AT_2AM)
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

  @Cron(CronExpression.EVERY_30_MINUTES)
  async syncWhitelistStatus() {
    const missedInvestors = await this.addressRepo.getMissingWhitelistedUsers()
    console.log(`Whitelisting ${missedInvestors.length} missed investors.`)

    missedInvestors.forEach((investor) => {
      this.memberlistService.update(investor.userId, investor.poolId, investor.tranche)
    })
  }
}
