import { DatabaseRepository } from '../database/database.repository';
import { DatabaseProvider } from '../database/database.providers';
import { tokens as databaseTokens } from '../database/database.constants';
import { tokens as contactsTokens } from './contacts.constants';

export const contactsProviderFactory = {
  provide: contactsTokens.contactsRepository,
  useFactory: (connection: DatabaseProvider) =>
    new DatabaseRepository(connection.contacts),
  inject: [databaseTokens.databaseConnectionFactory],
};
