import { BadRequestException, Controller, Get, Param, Query } from '@nestjs/common'

import { SecuritizeService } from '../services/kyc/securitize.service'
import { AddressRepo } from '../repos/address.repo'
import { KycRepo } from '../repos/kyc.repo'

@Controller()
export class AddressController {
  constructor(
    private readonly addressRepo: AddressRepo,
    private readonly securitizeService: SecuritizeService,
    private readonly kycRepo: KycRepo
  ) {}

  @Get('addresses/:address/status')
  async getStatus(@Param() params, @Query() query): Promise<AddressStatus> {
    const blockchain = query.blockchain || 'ethereum'
    const network = query.network || 'mainnet'

    const address = await this.addressRepo.findOrCreate(blockchain, network, params.address)
    if (!address) throw new BadRequestException('Failed to create address')

    const kyc = await this.kycRepo.find(address.userId)
    if (kyc) {
      return {
        kyc: {
          createdAt: kyc.createdAt,
        },
        agreements: [],
      }
    }

    const authorizationLink = this.securitizeService.getAuthorizationLink(params.address)
    return {
      kyc: {
        url: authorizationLink,
      },
      agreements: [],
    }
  }
}

export interface KycStatus {
  createdAt?: Date
  verifiedAt?: Date
  url?: string
}

export interface AgreementsStatus {}

export interface AddressStatus {
  kyc: KycStatus
  agreements: AgreementsStatus[]
}
