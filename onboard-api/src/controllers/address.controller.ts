import { BadRequestException, Controller, Delete, Get, Param, Query, UnauthorizedException } from '@nestjs/common'
import { AddressRepo } from '../repos/address.repo'
import { Agreement, AgreementRepo } from '../repos/agreement.repo'
import { InvestmentRepo } from '../repos/investment.repo'
import { KycRepo } from '../repos/kyc.repo'
import { UserRepo } from '../repos/user.repo'
import { SecuritizeService } from '../services/kyc/securitize.service'
import { PoolService, ProfileAgreement } from '../services/pool.service'
import { SessionService } from '../services/session.service'
import { AddressStatus, AgreementsStatus, KycStatusLabel } from './types'

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
  async getStatus(@Param() params): Promise<AddressStatus> {
    const pool = await this.poolService.get(params.poolId)
    if (!pool) throw new BadRequestException('Invalid pool')

    const blockchain = 'ethereum' // TODO: take this from the pool config as well
    const network = pool.network || 'mainnet'

    const address = await this.addressRepo.findOrCreate(blockchain, network, params.address)
    if (!address) throw new BadRequestException('Failed to create address')

    const user = await this.userRepo.find(address.userId)
    if (!user) throw new BadRequestException('Invalid user')

    const authorizationLink = this.securitizeService.getAuthorizationLink(params.poolId, params.address)
    const kyc = await this.kycRepo.find(address.userId)
    if (kyc) {
      let status: KycStatusLabel = kyc.status

      if (kyc.status !== 'verified' || (kyc.usaTaxResident && !kyc.accredited)) {
        const investor = await this.securitizeService.getInvestor(kyc.userId, kyc.providerAccountId, kyc.digest)

        if (!investor) {
          return {
            kyc: {
              url: authorizationLink,
              requiresSignin: true,
            },
            agreements: [],
          }
        }

        if (investor.verificationStatus !== kyc.status) {
          this.kycRepo.setStatus(
            'securitize',
            kyc.providerAccountId,
            investor.verificationStatus === 'manual-review' ? 'processing' : investor.verificationStatus,
            investor.domainInvestorDetails.isUsaTaxResident,
            investor.domainInvestorDetails.isAccredited
          )
          status = investor.verificationStatus === 'manual-review' ? 'processing' : investor.verificationStatus
        }
      }

      // Filter profile agreements by country
      const profileAgreements = pool.profile?.agreements
        .filter((pa: ProfileAgreement) => {
          return (
            (user.countryCode === 'US' && pa.country === 'non-us') || (user.countryCode !== 'US' && pa.country === 'us')
          )
        })
        .map((pa: ProfileAgreement) => {
          return {
            name: pa.name,
            tranche: pa.tranche,
            provider: pa.provider,
            providerTemplateId: pa.providerTemplateId,
          }
        })

      // Retrieve
      const agreementLinks = await this.agreementRepo.getStatusForProfileAgreements(profileAgreements)

      const isWhitelisted = await this.investmentRepo.getWhitelistStatus(address.id, params.poolId)

      return {
        kyc: {
          status,
          isWhitelisted,
          url: authorizationLink,
          isUsaTaxResident: kyc.usaTaxResident,
          accredited: kyc.accredited,
        },
        agreements: agreementLinks,
      }
    }

    return {
      kyc: {
        url: authorizationLink,
      },
      agreements: [],
    }
  }

  // TODO: this is a temporary method to delete users only on kovan. Should be removed or implemented properly at some point
  @Delete('addresses/:address')
  async deleteMyAccount(@Param() params, @Query() query): Promise<any> {
    const user = await this.userRepo.findByAddress(params.address)
    if (!user) throw new BadRequestException('Invalid user')

    const verifiedSession = this.sessionService.verify(query.session)
    if (!verifiedSession || verifiedSession.sub !== user.id) throw new UnauthorizedException('Invalid session')

    this.userRepo.delete(params.address, 'ethereum', 'kovan')
  }
}
