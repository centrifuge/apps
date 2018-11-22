import { DatabaseProvider } from '../database/database.providers';
import { DatabaseRepository } from '../database/database.repository';
import { CreateInvoiceDto } from './dto/create-invoice.dto';
import { tokens as databaseTokens } from '../database/database.constants';
import { tokens as invoicesTokens } from '../invoices/invoices.constants';

export const invoicesRepository = {
  provide: invoicesTokens.invoicesRepository,
  inject: [databaseTokens.databaseConnectionFactory],
  useFactory: (
    databaseProvider: DatabaseProvider,
  ): DatabaseRepository<CreateInvoiceDto> =>
    new DatabaseRepository(databaseProvider.invoices),
};
