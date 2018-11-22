import { Module } from '@nestjs/common';
import { InvoicesController } from './invoices.controller';
import { InvoicesService } from './invoices.service';
import { invoicesRepository } from './invoices.repository';
import { databaseConnectionFactory } from '../database/database.providers';
import { DatabaseModule } from '../database/database.module';
import { invoiceProviderFactory } from './invoice.providers';

@Module({
  controllers: [InvoicesController],
  providers: [
    InvoicesService,
    invoicesRepository,
    databaseConnectionFactory,
    invoiceProviderFactory,
  ],
  imports: [DatabaseModule],
})
export class InvoicesModule {}
