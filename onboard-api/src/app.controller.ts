import { Controller, Get, Query, Param } from '@nestjs/common'

import { SecuritizeService } from './securitize.service'
import { DocusignService } from './docusign.service'
import { DocusignAuthService } from './docusign-auth.service'

@Controller()
export class AppController {
  constructor(
    private readonly securitizeService: SecuritizeService,
    private readonly docusignService: DocusignService,
    private readonly docusignAuthService: DocusignAuthService
  ) {}

  @Get()
  getHello(): string {
    return 'OK'
  }

  @Get('authorization')
  getAuthorizationLink(): string {
    return this.securitizeService.getAuthorizationLink('0x0A735602a357802f553113F5831FE2fbf2F0E2e0')
  }

  @Get('authorization/:address/callback/securitize')
  getAuthorizationCallback(@Param() params, @Query() query): Promise<any> {
    const kycInfo = this.securitizeService.processAuthorizationCallback(params.address, query.code)
    // const agreement = this.docusignService.getAgreementURL('jeroen+signer@centrifuge.io')
    return kycInfo
  }

  @Get('agreement')
  async getAgreement(): Promise<string> {
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
