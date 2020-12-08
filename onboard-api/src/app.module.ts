import { Module } from '@nestjs/common'
import { AppController } from './app.controller'
import { AddressController } from './controllers/address.controller'
import { AgreementController } from './controllers/agreement.controller'
import { KycController } from './controllers/kyc.controller'
import { AddressRepo } from './repos/address.repo'
import { AgreementRepo } from './repos/agreement.repo'
import { DatabaseService } from './repos/db.service'
import { KycRepo } from './repos/kyc.repo'
import { UserRepo } from './repos/user.repo'
import { DocusignAuthService } from './services/docusign-auth.service'
import { DocusignService } from './services/docusign.service'
import { SecuritizeService } from './services/kyc/securitize.service'
import { PoolService } from './services/pool.service'
import { SessionService } from './services/session.service'

const databaseProviders = [DatabaseService, UserRepo, AddressRepo, KycRepo, AgreementRepo]
const serviceProviders = [PoolService, SecuritizeService, DocusignService, DocusignAuthService, SessionService]

@Module({
  imports: [],
  controllers: [AppController, AddressController, KycController, AgreementController],
  providers: [...databaseProviders, ...serviceProviders],
})
export class AppModule {}
