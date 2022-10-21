import { BadRequestException, Controller, Get, Logger, Param, Query, Res } from '@nestjs/common'
import config from '../config'
import { AddressRepo } from '../repos/address.repo'
import { KycRepo } from '../repos/kyc.repo'
import { UserRepo } from '../repos/user.repo'
import { SecuritizeService } from '../services/kyc/securitize.service'
import MailerService from '../services/mailer.service'
import { CustomPoolIds, PoolService } from '../services/pool.service'
import { SessionService } from '../services/session.service'

@Controller()
export class KycController {
  private readonly logger = new Logger(KycController.name)
  mailer = new MailerService()

  constructor(
    private readonly securitizeService: SecuritizeService,
    private readonly addressRepo: AddressRepo,
    private readonly kycRepo: KycRepo,
    private readonly userRepo: UserRepo,
    private readonly poolService: PoolService,
    private readonly sessionService: SessionService
  ) {}

  @Get('pools/:poolId/callback/:address/securitize')
  async securitizeCallback(@Param() params, @Query() query, @Res({ passthrough: true }) res) {
    // Check input
    const pool = await this.poolService.get(params.poolId)
    if (!pool) throw new BadRequestException('Invalid pool')

    const blockchain = 'ethereum' // TODO: take this from the pool config as well
    const network = pool.network || 'mainnet'

    const address = await this.addressRepo.find(blockchain, network, params.address)
    if (!address) throw new BadRequestException(`Address ${address} does not exist`)

    // Get info from Securitize
    const kycInfo = await this.securitizeService.processAuthorizationCallback(query.code)
    // TODO: redirect to app?
    if (!kycInfo.providerAccountId) {
      this.logger.warn('Securitize code has already been used')
      const redirectUrl = CustomPoolIds.includes(params.poolId)
        ? `${query.origin}/onboarding/${params.poolId}`
        : `${query.origin}/pool/${params.poolId}/${pool.metadata.slug}/onboarding?tranche=${query.tranche || 'senior'}`
      return res.redirect(redirectUrl)
    }

    // Update KYC and user records in our database
    const existingKyc = await this.kycRepo.findByProvider('securitize', kycInfo.providerAccountId)
    if (existingKyc && existingKyc.userId !== address.userId) {
      // If this provider account is already linked to a diffferent user, then add this address to that user
      await this.addressRepo.linkToNewUser(address.id, existingKyc.userId)
    }
    const userId = existingKyc?.userId || address.userId

    const investor = await this.securitizeService.getInvestor(userId, kycInfo.providerAccountId, kycInfo.digest)
    if (!investor) throw new BadRequestException('Failed to retrieve investor information from Securitize')

    const kyc = await this.kycRepo.upsertSecuritize(userId, kycInfo.providerAccountId, kycInfo.digest)
    if (!kyc) throw new BadRequestException('Failed to create KYC entity')

    await this.userRepo.update(
      userId,
      investor.email,
      investor.details.address.countryCode,
      investor.domainInvestorDetails?.investorFullName,
      investor.domainInvestorDetails?.entityName
    )

    this.kycRepo.setStatus(
      'securitize',
      kyc.providerAccountId,
      investor.verificationStatus === 'manual-review' ? 'processing' : investor.verificationStatus,
      investor.domainInvestorDetails?.isUsaTaxResident,
      investor.domainInvestorDetails?.isAccredited
    )
    // Send KYC status email if status is updated
    if (kyc.status !== investor.verificationStatus) {
      if (kyc.status === 'processing' && investor.verificationStatus === 'manual-review') {
      } // do nothing
      else {
        await this.mailer.sendKycStatusEmail(investor.fullName, investor.email, investor.verificationStatus)
      }
    }

    // Link user to pool/tranche so we know which pools a user has shown interest in
    await this.userRepo.linkToPool(userId, params.poolId, query.tranche || 'senior')

    // Create session and redirect user
    const session = this.sessionService.create(userId)

    const redirectUrl = CustomPoolIds.includes(params.poolId)
      ? `${query.origin}/onboarding/${params.poolId}?session=${session}`
      : `${query.origin}/pool/${params.poolId}/${pool.metadata.slug}/onboarding?session=${session}&tranche=${
          query.tranche || 'senior'
        }`

    return res.redirect(redirectUrl)
  }

  @Get('callback/:address/securitize')
  async securitizeOnboardingCallback(@Param() params, @Query() query, @Res({ passthrough: true }) res) {
    const blockchain = 'ethereum' // TODO: take this from the pool config as well
    const network = 'mainnet'

    const address = await this.addressRepo.find(blockchain, network, params.address)
    if (!address) throw new BadRequestException(`Address ${address} does not exist`)

    // Get info from Securitize
    const kycInfo = await this.securitizeService.processAuthorizationCallback(query.code)
    // TODO: redirect to app?
    if (!kycInfo.providerAccountId) {
      this.logger.warn('Securitize code has already been used')
      const redirectUrl = `${query.origin}/onboarding?tranche=${query.tranche || 'senior'}`
      return res.redirect(redirectUrl)
    }

    // Update KYC and user records in our database
    const existingKyc = await this.kycRepo.findByProvider('securitize', kycInfo.providerAccountId)
    if (existingKyc && existingKyc.userId !== address.userId) {
      // If this provider account is already linked to a diffferent user, then add this address to that user
      await this.addressRepo.linkToNewUser(address.id, existingKyc.userId)
    }
    const userId = existingKyc?.userId || address.userId

    const investor = await this.securitizeService.getInvestor(userId, kycInfo.providerAccountId, kycInfo.digest)
    if (!investor) throw new BadRequestException('Failed to retrieve investor information from Securitize')

    const kyc = await this.kycRepo.upsertSecuritize(userId, kycInfo.providerAccountId, kycInfo.digest)
    if (!kyc) throw new BadRequestException('Failed to create KYC entity')

    await this.userRepo.update(
      userId,
      investor.email,
      investor.details.address.countryCode,
      investor.domainInvestorDetails?.investorFullName,
      investor.domainInvestorDetails?.entityName
    )

    this.kycRepo.setStatus(
      'securitize',
      kyc.providerAccountId,
      investor.verificationStatus === 'manual-review' ? 'processing' : investor.verificationStatus,
      investor.domainInvestorDetails?.isUsaTaxResident,
      investor.domainInvestorDetails?.isAccredited
    )

    // Send KYC status email if status is updated
    if (kyc.status !== investor.verificationStatus) {
      if (kyc.status === 'processing' && investor.verificationStatus === 'manual-review') {
      } // do nothing
      else {
        await this.mailer.sendKycStatusEmail(investor.fullName, investor.email, investor.verificationStatus)
      }
    }

    // Create session and redirect user
    const session = this.sessionService.create(userId)

    const redirectUrl = `${query.origin}/onboarding?session=${session}&tranche=${params.tranche || 'senior'}`
    return res.redirect(redirectUrl)
  }

  @Get('pools/:poolId/info-redirect')
  async updateInfoRedirect(@Res({ passthrough: true }) res) {
    return res.redirect(config.securitize.idHost)
  }
}
