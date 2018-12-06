import { DatabaseProvider } from '../database/database.providers';
import { DatabaseRepository } from '../database/database.repository';
import { tokens as databaseTokens } from '../database/database.constants';
import { tokens as contactsTokens } from './contacts.constants';
import { Contact } from '../../../src/common/models/dto/contact';

export const contactsRepository = {
  provide: contactsTokens.contactsRepository,
  inject: [databaseTokens.databaseConnectionFactory],
  useFactory: (
    databaseProvider: DatabaseProvider,
  ): DatabaseRepository<Contact> =>
    new DatabaseRepository(databaseProvider.contacts),
};
