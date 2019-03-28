import { Inject, Injectable } from '@nestjs/common';
import * as bcrypt from 'bcrypt';
import { promisify } from 'util';

import { User } from '../../../src/common/models/user';
import { DatabaseService } from '../database/database.service';

@Injectable()
export class AuthService {
  constructor(
    private readonly database: DatabaseService,
  ) {}

  /**
   * Checks that a user/password pair exists in the database
   * @async
   * @param {string} username
   * @param {string} password
   *
   * @return {Promise<User|null>} promise - a promise with the validation results. If successful
   * will return the user, otherwise it returns null.
   */
  async validateUser(username: string, password: string): Promise<User | null> {
    const user: User = await this.database.users.findOne({ username });
    if (user) {
      if (!user.enabled) {
        return null;
      }

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
