import { DatabaseRepository } from '../database/database.repository';
import { DatabaseProvider } from '../database/database.providers';
import { tokens as databaseTokens } from '../database/database.constants';
import { tokens as invoicesTokens } from '../invoices/invoices.constants';

export const invoiceProviderFactory = {
  provide: invoicesTokens.invoicesRepository,
  useFactory: (connection: DatabaseProvider) =>
    new DatabaseRepository(connection.invoices),
  inject: [databaseTokens.databaseConnectionFactory],
};
