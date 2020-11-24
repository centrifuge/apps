import { Module } from '@nestjs/common'

import { AppController } from './app.controller'
import { DatabaseService } from './repos/db.service'
import { UserRepo } from './repos/user.repo'
import { SecuritizeService } from './providers/kyc/securitize.service'
import { DocusignService } from './providers/docusign.service'
import { DocusignAuthService } from './providers/docusign-auth.service'

@Module({
  imports: [],
  controllers: [AppController],
  providers: [DatabaseService, UserRepo, SecuritizeService, DocusignService, DocusignAuthService],
})
export class AppModule {}
