import * as Nedb from 'nedb';
import { tokens } from './database.constants';
import { User } from '../../../src/common/models/dto/user';

export interface DatabaseProvider {
  invoices: Nedb;
  users: Nedb;
  contacts: Nedb
}

const testUser = new User(
  'test',
  '$2b$12$o7HxJQsEl0jjwZ6FoGiEv.uQs9hLDFo2fOj5S3BnLL4nGpLfy/yW2', // password is test
  'test_user_1',
);

export const databaseConnectionFactory = {
  provide: tokens.databaseConnectionFactory,
  useFactory: async (): Promise<DatabaseProvider> => {
    const databaseConnections = {} as DatabaseProvider;

    databaseConnections.invoices = new Nedb();
    await databaseConnections.invoices.loadDatabase();

    databaseConnections.users = new Nedb();
    await databaseConnections.users.loadDatabase();
    await databaseConnections.users.insert(testUser);

    databaseConnections.contacts = new Nedb();
    await databaseConnections.contacts.loadDatabase();

    return databaseConnections;
  },
};
