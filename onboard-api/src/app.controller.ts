import { Controller, Get, Query, Param, NotFoundException } from '@nestjs/common'

import { SecuritizeService } from './services/kyc/securitize.service'
import { DocusignService } from './services/docusign.service'
import { DocusignAuthService } from './services/docusign-auth.service'
import { UserRepo, User } from './repos/user.repo'

@Controller()
export class AppController {
  constructor(
    private readonly securitizeService: SecuritizeService,
    private readonly docusignService: DocusignService,
    private readonly docusignAuthService: DocusignAuthService,
    private readonly userRepo: UserRepo
  ) {}

  @Get()
  getHello(): string {
    return 'OK'
  }

  @Get('users/email/:email')
  checkEmail(@Param() params): Promise<User> {
    const user = this.userRepo.getByEmail(params.email)
    if (!user) throw new NotFoundException('User not found')
    return user
  }

  @Get('authorization')
  getAuthorizationLink(): string {
    return this.securitizeService.getAuthorizationLink('0x0A735602a357802f553113F5831FE2fbf2F0E2e0')
  }

  @Get('authorization/:address/callback/securitize')
  async getAuthorizationCallback(@Param() params, @Query() query): Promise<any> {
    const kycInfo = await this.securitizeService.processAuthorizationCallback(params.address, query.code)
    const investor = await this.securitizeService.getInvestor(kycInfo.authTokens.accessToken)
    const agreement = await this.docusignService.getAgreementURL(investor.email)
    return { investor, agreement }
  }

  @Get('agreement')
  async getAgreement(): Promise<string> {
    await this.docusignAuthService.getUserInfo()
    return await this.docusignService.getAgreementURL('jeroen+signer@centrifuge.io')
  }

  @Get('docusign/authorization')
  getDocusignAuthorization(): string {
    return this.docusignAuthService.getAuthorizationLink()
  }

  @Get('docusign/callback')
  async getDocusignCallback(): Promise<any> {
    await this.docusignAuthService.getAccessToken()
    return 'Callback received'
  }
}
