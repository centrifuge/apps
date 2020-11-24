import { Module } from '@nestjs/common'
import { AppController } from './app.controller'
import { SecuritizeService } from './providers/kyc/securitize.service'
import { DocusignService } from './providers/docusign.service'
import { DocusignAuthService } from './providers/docusign-auth.service'

@Module({
  imports: [],
  controllers: [AppController],
  providers: [SecuritizeService, DocusignService, DocusignAuthService],
})
export class AppModule {}
