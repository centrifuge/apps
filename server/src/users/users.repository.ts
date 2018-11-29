import { DatabaseProvider } from '../database/database.providers';
import { DatabaseRepository } from '../database/database.repository';
import { User } from '../../../src/common/models/dto/user';
import { tokens as databaseTokens } from '../database/database.constants';
import { tokens as usersTokens } from './users.constants';

export const UsersRepository = {
  provide: usersTokens.UsersRepository,
  inject: [databaseTokens.databaseConnectionFactory],
  useFactory: (
    databaseProvider: DatabaseProvider,
  ): DatabaseRepository<User> =>
    new DatabaseRepository(databaseProvider.users),
};
