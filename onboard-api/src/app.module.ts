import { Module } from '@nestjs/common'
import { AppController } from './app.controller'
import { SecuritizeService } from './securitize.service'
import { DocusignService } from './docusign.service'
import { DocusignAuthService } from './docusign-auth.service'

@Module({
  imports: [],
  controllers: [AppController],
  providers: [SecuritizeService, DocusignService, DocusignAuthService],
})
export class AppModule {}
