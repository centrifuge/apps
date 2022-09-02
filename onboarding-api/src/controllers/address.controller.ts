import { BadRequestException, Controller, Delete, Get, Param, Query, Req, UnauthorizedException } from '@nestjs/common'
import config from 'src/config'
import { AddressEntity, AddressRepo } from '../repos/address.repo'
import { AgreementRepo } from '../repos/agreement.repo'
import { InvestmentRepo } from '../repos/investment.repo'
import { KycRepo } from '../repos/kyc.repo'
import { UserRepo } from '../repos/user.repo'
import { SecuritizeService } from '../services/kyc/securitize.service'
import { PoolService, ProfileAgreement } from '../services/pool.service'
import { SessionService } from '../services/session.service'
import { AddressStatus, KycStatusLabel } from './types'

@Controller()
export class AddressController {
  constructor(
    private readonly addressRepo: AddressRepo,
    private readonly securitizeService: SecuritizeService,
    private readonly kycRepo: KycRepo,
    private readonly agreementRepo: AgreementRepo,
    private readonly poolService: PoolService,
    private readonly userRepo: UserRepo,
    private readonly investmentRepo: InvestmentRepo,
    private readonly sessionService: SessionService
  ) {}

  @Get('pools/:poolId/addresses/:address')
  async getStatus(@Param() params, @Query() query, @Req() req): Promise<AddressStatus> {
    const origin = req.get('origin') || config.tinlakeUiHost

    const pool = await this.poolService.get(params.poolId)
    if (!pool) throw new BadRequestException('Invalid pool')

    const blockchain = 'ethereum' // TODO: take this from the pool config as well
    const network = pool.network || 'mainnet'

    const address = await this.addressRepo.findOrCreate(blockchain, network, params.address)
    if (!address) throw new BadRequestException('Failed to create address')

    const user = await this.userRepo.find(address.userId)
    if (!user) throw new BadRequestException('Invalid user')

    const authorizationLink = this.securitizeService.getAuthorizationLink(
      origin,
      params.address,
      params.poolId,
      query.tranche || 'senior'
    )
    const kyc = await this.kycRepo.find(address.userId)
    if (kyc) {
      let status: KycStatusLabel = kyc.status

      const isEntity = user.entityName?.length > 0

      if (kyc.status !== 'verified' || (kyc.usaTaxResident && !kyc.accredited)) {
        const investor = await this.securitizeService.getInvestor(kyc.userId, kyc.providerAccountId, kyc.digest)

        if (!investor) {
          return {
            kyc: {
              url: authorizationLink,
              requiresSignin: true,
            },
            agreements: [],
            linkedAddresses: [],
          }
        }

        if (investor.verificationStatus !== kyc.status) {
          this.kycRepo.setStatus(
            'securitize',
            kyc.providerAccountId,
            investor.verificationStatus === 'manual-review' ? 'processing' : investor.verificationStatus,
            investor.domainInvestorDetails?.isUsaTaxResident,
            investor.domainInvestorDetails?.isAccredited
          )
          status = investor.verificationStatus === 'manual-review' ? 'processing' : investor.verificationStatus
        }
      }

      // Filter profile agreements by country & investor type
      const profileAgreements = pool.profile?.agreements
        .filter((pa: ProfileAgreement) => {
          return !pa.country || (kyc.usaTaxResident ? pa.country === 'us' : pa.country === 'non-us')
        })
        .filter((pa: ProfileAgreement) => {
          return !pa.target || (isEntity ? pa.target === 'entity' : pa.target === 'individual')
        })
        .map((pa: ProfileAgreement) => {
          return {
            name: pa.name,
            tranche: pa.tranche,
            provider: pa.provider,
            providerTemplateId: pa.providerTemplateId,
          }
        })

      // Retrieve status for agreements
      const agreementLinks = await this.agreementRepo.getStatusForProfileAgreements(
        user.id,
        params.poolId,
        profileAgreements
      )

      const isWhitelisted = await this.investmentRepo.getWhitelistStatus(address.id, params.poolId)

      // TODO: this should also filter by blockchain and network
      const addresses = await this.addressRepo.getByUser(address.userId)
      const otherAddresses = addresses
        .map((a: AddressEntity) => a.address)
        .filter((a) => {
          return a !== address.address
        })

      // Check country restrictions
      const restrictedGlobal = config.globalRestrictedCountries.includes(user.countryCode)
      const restrictedPool = pool.profile.issuer.restrictedCountryCodes?.includes(user.countryCode)
      const showNonSolicitationNotice =
        pool.profile.issuer.nonSolicitationNotice === 'non-us'
          ? !kyc.usaTaxResident
          : pool.profile.issuer.nonSolicitationNotice === 'none'
          ? false
          : true

      return {
        restrictedGlobal,
        restrictedPool,
        showNonSolicitationNotice,
        kyc: {
          status,
          isWhitelisted,
          isEntity,
          url: authorizationLink,
          isUsaTaxResident: kyc.usaTaxResident,
          accredited: kyc.accredited,
        },
        agreements: agreementLinks,
        linkedAddresses: otherAddresses,
      }
    }

    return {
      kyc: {
        url: authorizationLink,
      },
      agreements: [],
      linkedAddresses: [],
    }
  }

  @Get('addresses/:address')
  async getStatusForAddress(@Param() params, @Query() query): Promise<AddressStatus> {
    const blockchain = 'ethereum' // TODO: take this from the pool config as well
    const network = 'mainnet'

    const address = await this.addressRepo.findOrCreate(blockchain, network, params.address)
    if (!address) throw new BadRequestException('Failed to create address')

    const user = await this.userRepo.find(address.userId)
    if (!user) throw new BadRequestException('Invalid user')

    const authorizationLink = this.securitizeService.getAuthorizationLink(
      params.address,
      undefined,
      query.tranche || 'senior'
    )
    const kyc = await this.kycRepo.find(address.userId)
    if (kyc) {
      let status: KycStatusLabel = kyc.status

      const isEntity = user.entityName?.length > 0

      if (kyc.status !== 'verified' || (kyc.usaTaxResident && !kyc.accredited)) {
        const investor = await this.securitizeService.getInvestor(kyc.userId, kyc.providerAccountId, kyc.digest)

        if (!investor) {
          return {
            kyc: {
              url: authorizationLink,
              requiresSignin: true,
            },
            agreements: [],
            linkedAddresses: [],
          }
        }

        if (investor.verificationStatus !== kyc.status) {
          this.kycRepo.setStatus(
            'securitize',
            kyc.providerAccountId,
            investor.verificationStatus === 'manual-review' ? 'processing' : investor.verificationStatus,
            investor.domainInvestorDetails?.isUsaTaxResident,
            investor.domainInvestorDetails?.isAccredited
          )
          status = investor.verificationStatus === 'manual-review' ? 'processing' : investor.verificationStatus
        }
      }

      // TODO: this should also filter by blockchain and network
      const addresses = await this.addressRepo.getByUser(address.userId)
      const otherAddresses = addresses
        .map((a: AddressEntity) => a.address)
        .filter((a) => {
          return a !== address.address
        })

      // Check country restrictions
      const restrictedGlobal = config.globalRestrictedCountries.includes(user.countryCode)

      return {
        restrictedGlobal,
        kyc: {
          status,
          isEntity,
          url: authorizationLink,
          isUsaTaxResident: kyc.usaTaxResident,
          accredited: kyc.accredited,
        },
        agreements: [],
        linkedAddresses: otherAddresses,
      }
    }

    return {
      kyc: {
        url: authorizationLink,
      },
      agreements: [],
      linkedAddresses: [],
    }
  }

  @Delete('addresses/:address')
  async unlinkAddress(@Param() params, @Query() query): Promise<any> {
    const user = await this.userRepo.findByAddress(params.address)
    if (!user) throw new BadRequestException('Invalid user')

    const verifiedSession = this.sessionService.verify(query.session)
    if (!verifiedSession || verifiedSession.sub !== user.id) throw new UnauthorizedException('Invalid session')

    this.addressRepo.unlink(user.id, params.address)
  }

  // TODO: this is a temporary method to delete users only on goerli. Should be removed or implemented properly at some point
  @Delete('addresses/:address')
  async deleteMyAccount(@Param() params, @Query() query): Promise<any> {
    const user = await this.userRepo.findByAddress(params.address)
    if (!user) throw new BadRequestException('Invalid user')

    const verifiedSession = this.sessionService.verify(query.session)
    if (!verifiedSession || verifiedSession.sub !== user.id) throw new UnauthorizedException('Invalid session')

    this.userRepo.delete(params.address, 'ethereum', 'goerli')
  }
}
