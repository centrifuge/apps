import { Module } from '@nestjs/common'
import { ScheduleModule } from '@nestjs/schedule'
import { AppController } from './app.controller'
import { AddressController } from './controllers/address.controller'
import { AgreementController } from './controllers/agreement.controller'
import { KycController } from './controllers/kyc.controller'
import { AddressRepo } from './repos/address.repo'
import { AgreementRepo } from './repos/agreement.repo'
import { DatabaseService } from './repos/db.service'
import { InvestmentRepo } from './repos/investment.repo'
import { KycRepo } from './repos/kyc.repo'
import { UserRepo } from './repos/user.repo'
import { DocusignAuthService } from './services/docusign-auth.service'
import { DocusignService } from './services/docusign.service'
import { SecuritizeService } from './services/kyc/securitize.service'
import { MemberlistService } from './services/memberlist.service'
import { PoolService } from './services/pool.service'
import { SessionService } from './services/session.service'
import { SyncService } from './services/sync.service'

// TODO: separate into modules
const databaseProviders = [DatabaseService, UserRepo, AddressRepo, KycRepo, AgreementRepo, InvestmentRepo]
const serviceProviders = [
  PoolService,
  SecuritizeService,
  DocusignService,
  DocusignAuthService,
  SessionService,
  MemberlistService,
]
const taskProviders = [SyncService]

@Module({
  imports: [ScheduleModule.forRoot()],
  controllers: [AppController, AddressController, KycController, AgreementController],
  providers: [...databaseProviders, ...serviceProviders, ...taskProviders],
})
export class AppModule {}
