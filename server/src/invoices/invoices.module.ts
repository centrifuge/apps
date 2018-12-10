import { Module } from '@nestjs/common';

import { InvoicesController } from './invoices.controller';
import { databaseConnectionFactory } from '../database/database.providers';
import { DatabaseModule } from '../database/database.module';
import { AuthModule } from '../auth/auth.module';
import { centrifugeClientFactory } from '../centrifuge-client/centrifuge.client';
import { CentrifugeModule } from '../centrifuge-client/centrifuge.module';

@Module({
  controllers: [InvoicesController],
  providers: [
    databaseConnectionFactory,
    centrifugeClientFactory,
  ],
  imports: [DatabaseModule, AuthModule, CentrifugeModule],
})
export class InvoicesModule {}
