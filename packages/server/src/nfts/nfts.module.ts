import { DatabaseModule } from '../database/database.module';
import { AuthModule } from '../auth/auth.module';
import { CentrifugeModule } from '../centrifuge-client/centrifuge.module';
import { NftsController } from './nfts.controller';
import { Module } from '@nestjs/common';

@Module({
  controllers: [NftsController],
  providers: [],
  imports: [DatabaseModule, AuthModule, CentrifugeModule],
})

export class NftsModule {
}
