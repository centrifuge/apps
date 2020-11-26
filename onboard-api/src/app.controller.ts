import { Controller, Get } from '@nestjs/common'
import { DocusignAuthService } from './services/docusign-auth.service'

@Controller()
export class AppController {
  constructor(private readonly docusignAuthService: DocusignAuthService) {}

  @Get()
  getHello(): string {
    return 'OK'
  }

  // These two endpoints are used to provide consent for the API user
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
