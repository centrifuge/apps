import * as Nedb from 'nedb';
import { tokens } from './database.constants';

export interface DatabaseProvider {
  invoices: Nedb;
}

export const databaseConnectionFactory = {
  provide: tokens.databaseConnectionFactory,
  useFactory: async (): Promise<DatabaseProvider> => {
    const databaseConnections = {} as DatabaseProvider;

    databaseConnections.invoices = new Nedb();
    await databaseConnections.invoices.loadDatabase();

    return databaseConnections;
  },
};
