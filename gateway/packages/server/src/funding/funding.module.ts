import { Module } from '@nestjs/common';
import { FundingController } from './funding.controller';
import { DatabaseModule } from '../database/database.module';
import { CentrifugeModule } from '../centrifuge-client/centrifuge.module';
import { AuthModule } from '../auth/auth.module';

@Module({
  controllers: [FundingController],
  providers: [],
  imports: [DatabaseModule, AuthModule, CentrifugeModule],
})
export class FundingModule {}
