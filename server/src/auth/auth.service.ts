import { Inject, Injectable } from '@nestjs/common';
import * as bcrypt from 'bcrypt';
import { promisify } from 'util';

import { User } from '../../../src/common/models/dto/user';
import { DatabaseProvider } from '../database/database.providers';
import { tokens } from '../database/database.constants';

@Injectable()
export class AuthService {
  constructor(
    @Inject(tokens.databaseConnectionFactory)
    private readonly database: DatabaseProvider,
  ) {}

  async validateUser(username: string, password: string): Promise<User | null> {
    const user = await this.database.users.findOne({ username });
    if (user) {
      const passwordMatch = await promisify(bcrypt.compare)(
        password,
        user.password,
      );

      if (passwordMatch) {
        return user;
      }
    }

    return null;
  }
}
