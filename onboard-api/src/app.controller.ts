import { Controller, Get, Res } from '@nestjs/common'
import { DocusignAuthService } from './services/docusign-auth.service'

@Controller()
export class AppController {
  constructor(private readonly docusignAuthService: DocusignAuthService) {}

  @Get()
  getRoot(): string {
    return 'OK'
  }

  // These two endpoints are used to provide consent for the Docusign API user
  @Get('docusign/authorization')
  getDocusignAuthorization(@Res({ passthrough: true }) res): string {
    return res.redirect(this.docusignAuthService.getAuthorizationLink())
  }

  @Get('docusign/callback')
  async getDocusignCallback(): Promise<string> {
    await this.docusignAuthService.getAccessToken()
    return 'Callback received'
  }
}
