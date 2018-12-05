import { Module } from '@nestjs/common';

import { InvoicesController } from './invoices.controller';
import { InvoicesService } from './invoices.service';
import { invoicesRepository } from './invoices.repository';
import { databaseConnectionFactory } from '../database/database.providers';
import { DatabaseModule } from '../database/database.module';
import { invoiceProviderFactory } from './invoice.providers';
import { AuthModule } from '../auth/auth.module';
import { centrifugeClientFactory } from '../centrifuge-client/centrifuge.client';
import { CentrifugeModule } from '../centrifuge-client/centrifuge.module';

@Module({
  controllers: [InvoicesController],
  providers: [
    InvoicesService,
    invoicesRepository,
    databaseConnectionFactory,
    invoiceProviderFactory,
    centrifugeClientFactory,
  ],
  imports: [DatabaseModule, AuthModule, CentrifugeModule],
})
export class InvoicesModule {}
