import { BadRequestException, Controller, Get, Param } from '@nestjs/common'
import { InvestmentRepo } from '../repos/investment.repo'
import { AddressRepo } from '../repos/address.repo'
import { Agreement, AgreementRepo } from '../repos/agreement.repo'
import { KycRepo } from '../repos/kyc.repo'
import { UserRepo } from '../repos/user.repo'
import { DocusignService } from '../services/docusign.service'
import { SecuritizeService } from '../services/kyc/securitize.service'
import { PoolService } from '../services/pool.service'
import { AddressStatus, AgreementsStatus, KycStatusLabel, Tranche } from './types'

@Controller()
export class AddressController {
  constructor(
    private readonly addressRepo: AddressRepo,
    private readonly securitizeService: SecuritizeService,
    private readonly kycRepo: KycRepo,
    private readonly agreementRepo: AgreementRepo,
    private readonly docusignService: DocusignService,
    private readonly poolService: PoolService,
    private readonly userRepo: UserRepo,
    private readonly investmentRepo: InvestmentRepo
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
            investor.verificationStatus as KycStatusLabel,
            investor.domainInvestorDetails.isUsaTaxResident,
            investor.domainInvestorDetails.isAccredited
          )
          status = investor.verificationStatus as KycStatusLabel
        }
      }

      const agreements = await this.agreementRepo.findByUserAndPool(
        address.userId,
        params.poolId,
        user.email,
        user.countryCode
      )

      // TODO: this should be handled in a Connect webhook from Docusign
      agreements.forEach(async (agreement: Agreement) => {
        if (!agreement.signedAt || !agreement.counterSignedAt) {
          const status = await this.docusignService.getEnvelopeStatus(agreement.providerEnvelopeId)
          if (!agreement.signedAt && status.signed) {
            await this.agreementRepo.setSigned(agreement.id)
          }

          if (!agreement.counterSignedAt && status.counterSigned) {
            await this.agreementRepo.setCounterSigned(agreement.id)
          }
        }
      })

      const agreementLinks = agreements.map(
        (agreement: Agreement): AgreementsStatus => {
          return {
            name: agreement.name,
            tranche: agreement.tranche,
            id: agreement.id,
            signed: agreement.signedAt !== null,
            counterSigned: agreement.counterSignedAt !== null,
          }
        }
      )

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
}
