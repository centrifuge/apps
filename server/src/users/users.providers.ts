import { DatabaseRepository } from '../database/database.repository';
import { DatabaseProvider } from '../database/database.providers';
import { tokens as databaseTokens } from '../database/database.constants';
import { tokens as usersTokens } from './users.constants';

export const UsersProviderFactory = {
  provide: usersTokens.UsersRepository,
  useFactory: (connection: DatabaseProvider) =>
    new DatabaseRepository(connection.users),
  inject: [databaseTokens.databaseConnectionFactory],
};
