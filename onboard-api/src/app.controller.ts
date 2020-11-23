import { Controller, Get, Query } from '@nestjs/common'
import { SecuritizeService } from './securitize.service'

@Controller()
export class AppController {
  constructor(private readonly securitizeService: SecuritizeService) {}

  @Get()
  getHello(): string {
    return 'OK'
  }

  @Get('authorization')
  getAuthorizationLink(): string {
    return this.securitizeService.getAuthorizationLink()
  }

  @Get('authorization/callback/securitize')
  getAuthorizationCallback(@Query() query): string {
    this.securitizeService.processAuthorizationCallback(query)

    return 'Callback received'
  }
}
