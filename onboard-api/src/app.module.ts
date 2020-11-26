import { Module } from '@nestjs/common'

import { AppController } from './app.controller'
import { AddressController } from './controllers/address.controller'

import { DatabaseService } from './repos/db.service'
import { AddressRepo } from './repos/address.repo'
import { UserRepo } from './repos/user.repo'

import { SecuritizeService } from './services/kyc/securitize.service'
import { DocusignService } from './services/docusign.service'
import { DocusignAuthService } from './services/docusign-auth.service'
import { PoolService } from './services/pool.service'

const databaseProviders = [DatabaseService, UserRepo, AddressRepo]
const serviceProviders = [PoolService, SecuritizeService, DocusignService, DocusignAuthService]

@Module({
  imports: [],
  controllers: [AppController, AddressController],
  providers: [...databaseProviders, ...serviceProviders],
})
export class AppModule {}
