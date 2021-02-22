import { BadRequestException, Controller, Get, Param, Res } from '@nestjs/common'
import config from './config'
import { DocusignAuthService } from './services/docusign-auth.service'
import { PoolService } from './services/pool.service'
const countries = require('i18n-iso-countries')

@Controller()
export class AppController {
  constructor(private readonly docusignAuthService: DocusignAuthService, private readonly poolService: PoolService) {}

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

  @Get('pools/:poolId/restricted-countries')
  async getRestrictedCountries(@Param() params): Promise<RestrictedCountry[]> {
    const codeToName = countries.getNames('en', { select: 'official' })

    const global = config.globalRestrictedCountries.map((code: string) => {
      return { code, name: codeToName[code] }
    })

    const pool = await this.poolService.get(params.poolId)
    if (!pool) throw new BadRequestException('Invalid pool')

    const poolLevel = pool.profile.issuer.restrictedCountryCodes.map((code: string) => {
      return { code, name: codeToName[code] }
    })

    return [...global, ...poolLevel]
  }
}

export interface RestrictedCountry {
  code: string
  name: string
}
