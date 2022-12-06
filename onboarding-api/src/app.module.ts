import { Module } from '@nestjs/common'
import { APP_INTERCEPTOR } from '@nestjs/core'
import { ScheduleModule } from '@nestjs/schedule'
import { RavenInterceptor, RavenModule } from 'nest-raven'
import { AppController } from './app.controller'
import config from './config'
import { AddressController } from './controllers/address.controller'
import { AgreementController } from './controllers/agreement.controller'
import { KycController } from './controllers/kyc.controller'
import { UserController } from './controllers/user.controller'
import { AddressRepo } from './repos/address.repo'
import { AgreementRepo } from './repos/agreement.repo'
import { DatabaseService } from './repos/db.service'
import { InvestmentRepo } from './repos/investment.repo'
import { KycRepo } from './repos/kyc.repo'
import { UserRepo } from './repos/user.repo'
import { DocusignAuthService } from './services/docusign-auth.service'
import { DocusignService } from './services/docusign.service'
import { SecuritizeService } from './services/kyc/securitize.service'
import { MailerService } from './services/mailer.service'
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
  MailerService,
]
const taskProviders = [SyncService]

const ravenProvider = config.sentryDsn
  ? [
      {
        provide: APP_INTERCEPTOR,
        useValue: new RavenInterceptor(),
      },
    ]
  : []

@Module({
  imports: config.sentryDsn ? [RavenModule, ScheduleModule.forRoot()] : [ScheduleModule.forRoot()],
  controllers: [AppController, AddressController, KycController, AgreementController, UserController],
  providers: [...databaseProviders, ...serviceProviders, ...taskProviders, ...ravenProvider],
})
export class AppModule {}
