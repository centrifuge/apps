import { BadRequestException, Controller, Get, Logger, Param, Query, Res } from '@nestjs/common'
import config from '../config'
import { AddressRepo } from '../repos/address.repo'
import { AgreementRepo } from '../repos/agreement.repo'
import { KycRepo } from '../repos/kyc.repo'
import { UserRepo } from '../repos/user.repo'
import { SecuritizeService } from '../services/kyc/securitize.service'
import { PoolService } from '../services/pool.service'
import { SessionService } from '../services/session.service'
import { KycStatusLabel } from './types'

@Controller()
export class KycController {
  private readonly logger = new Logger(KycController.name)

  constructor(
    private readonly securitizeService: SecuritizeService,
    private readonly addressRepo: AddressRepo,
    private readonly kycRepo: KycRepo,
    private readonly userRepo: UserRepo,
    private readonly agreementRepo: AgreementRepo,
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
      const redirectUrl = `${config.tinlakeUiHost}pool/${params.poolId}/${pool.metadata.slug}/onboarding`
      return res.redirect(redirectUrl)
    }

    const investor = await this.securitizeService.getInvestor(address.userId, kycInfo.providerAccountId, kycInfo.digest)
    if (!investor) throw new BadRequestException('Failed to retrieve investor information from Securitize')

    // Update KYC and user records in our database
    const kyc = await this.kycRepo.upsertSecuritize(address.userId, kycInfo.providerAccountId, kycInfo.digest)
    if (!kyc) throw new BadRequestException('Failed to create KYC entity')

    await this.userRepo.update(
      address.userId,
      investor.email,
      investor.details.address.countryCode,
      investor.domainInvestorDetails?.investorFullName,
      investor.domainInvestorDetails?.entityName
    )

    this.kycRepo.setStatus(
      'securitize',
      kyc.providerAccountId,
      investor.verificationStatus === 'manual-review' ? 'processing' : investor.verificationStatus,
      investor.domainInvestorDetails.isUsaTaxResident,
      investor.domainInvestorDetails.isAccredited
    )

    // Create agreements for this pool
    await this.agreementRepo.createAgreementsForPool(
      params.poolId,
      address.userId,
      investor.email,
      investor.details.address.countryCode
    )

    // Create session and redirect user
    const session = this.sessionService.create(address.userId)

    const redirectUrl = `${config.tinlakeUiHost}pool/${params.poolId}/${pool.metadata.slug}/onboarding?session=${session}`
    return res.redirect(redirectUrl)
  }

  @Get('pools/:poolId/info-redirect')
  async updateInfoRedirect(@Res({ passthrough: true }) res) {
    return res.redirect(config.securitize.idHost)
  }
}
