import { Controller, Get, Query, Param } from '@nestjs/common'
import { DocusignService } from './docusign.service'
import { SecuritizeService } from './securitize.service'

@Controller()
export class AppController {
  constructor(
    private readonly securitizeService: SecuritizeService,
    private readonly docusignService: DocusignService
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
    console.log({ address: params.address })
    return this.securitizeService.processAuthorizationCallback(params.address, query.code)
  }

  @Get('agreement')
  async getAgreement(): Promise<string> {
    return await this.docusignService.getAgreementURL('jeroen+signer@centrifuge.io')
  }
}
