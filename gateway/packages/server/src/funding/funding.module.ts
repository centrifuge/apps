import { Module } from '@nestjs/common'
import { AuthModule } from '../auth/auth.module'
import { CentrifugeModule } from '../centrifuge-client/centrifuge.module'
import { DatabaseModule } from '../database/database.module'
import { FundingController } from './funding.controller'

@Module({
  controllers: [FundingController],
  providers: [],
  imports: [DatabaseModule, AuthModule, CentrifugeModule],
})
export class FundingModule {}
