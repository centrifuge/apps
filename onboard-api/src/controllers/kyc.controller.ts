import { BadRequestException, Controller, Get, Param, Query } from '@nestjs/common'

import { KycRepo } from '../repos/kyc.repo'
import { AddressRepo } from '../repos/address.repo'
import { SecuritizeService } from '../services/kyc/securitize.service'
import { UserRepo } from '../repos/user.repo'

@Controller()
export class KycController {
  constructor(
    private readonly securitizeService: SecuritizeService,
    private readonly addressRepo: AddressRepo,
    private readonly kycRepo: KycRepo,
    private readonly userRepo: UserRepo
  ) {}

  @Get('callback/:address/securitize')
  async securitizeCallback(@Param() params, @Query() query): Promise<any> {
    const address = await this.addressRepo.find(params.address)
    if (!address) throw new BadRequestException(`Address ${address} does not exist`)

    const kycInfo = await this.securitizeService.processAuthorizationCallback(query.code)
    if (!kycInfo.providerAccountId) throw new BadRequestException('Code has already been used')

    const investor = await this.securitizeService.getInvestor(kycInfo.digest.accessToken)
    if (!investor) throw new BadRequestException('Failed to retrieve investor information from Securitize')

    console.log({ kycInfo })
    const kyc = await this.kycRepo.upsertSecuritize(address.userId, kycInfo.providerAccountId, kycInfo.digest)
    if (!kyc) throw new BadRequestException('Failed to create KYC entity')

    console.log(`Set email to ${investor.email}`)
    await this.userRepo.setEmail(address.userId, investor.email)

    console.log({ investor })
  }
}
