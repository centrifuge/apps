import { BadRequestException, Controller, Get, Param, Query, Res } from '@nestjs/common'
import { AddressRepo } from '../repos/address.repo'
import { AgreementRepo } from '../repos/agreement.repo'
import { KycRepo } from '../repos/kyc.repo'
import { UserRepo } from '../repos/user.repo'
import { SecuritizeService } from '../services/kyc/securitize.service'
import { PoolService } from '../services/pool.service'

@Controller()
export class KycController {
  constructor(
    private readonly securitizeService: SecuritizeService,
    private readonly addressRepo: AddressRepo,
    private readonly kycRepo: KycRepo,
    private readonly userRepo: UserRepo,
    private readonly agreementRepo: AgreementRepo,
    private readonly poolService: PoolService
  ) {}

  @Get('pools/:poolId/callback/:address/securitize')
  async securitizeCallback(@Param() params, @Query() query, @Res() res): Promise<any> {
    const address = await this.addressRepo.find(params.address)
    if (!address) throw new BadRequestException(`Address ${address} does not exist`)

    const pool = await this.poolService.get(params.poolId)
    if (!pool) throw new BadRequestException('Invalid pool')

    const kycInfo = await this.securitizeService.processAuthorizationCallback(query.code)
    // TODO: redirect to app?
    if (!kycInfo.providerAccountId) throw new BadRequestException('Code has already been used')

    const investor = await this.securitizeService.getInvestor(kycInfo.digest.accessToken)
    if (!investor) throw new BadRequestException('Failed to retrieve investor information from Securitize')

    const kyc = await this.kycRepo.upsertSecuritize(address.userId, kycInfo.providerAccountId, kycInfo.digest)
    if (!kyc) throw new BadRequestException('Failed to create KYC entity')

    await this.userRepo.setEmail(address.userId, investor.email)

    // TODO: templateId should be based on the agreement required for the pool
    const agreement = await this.agreementRepo.findOrCreate(
      address.userId,
      investor.email,
      params.poolId,
      process.env.DOCUSIGN_TEMPLATE_ID
    )
    if (!agreement) throw new BadRequestException('Failed to create agreement envelope')

    const redirectUrl = `${process.env.TINLAKE_UI_HOST}pool/${params.poolId}/${pool.metadata.slug}?onb=1`
    console.log({ redirectUrl })

    return res.redirect(redirectUrl)
  }
}
