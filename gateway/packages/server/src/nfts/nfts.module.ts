import { Module } from '@nestjs/common';
import { AuthModule } from '../auth/auth.module';
import { CentrifugeModule } from '../centrifuge-client/centrifuge.module';
import { DatabaseModule } from '../database/database.module';
import { NftsController } from './nfts.controller';

@Module({
  controllers: [NftsController],
  providers: [],
  imports: [DatabaseModule, AuthModule, CentrifugeModule],
})
export class NftsModule {}
