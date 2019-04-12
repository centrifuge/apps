import { Injectable } from '@nestjs/common';
import * as bcrypt from 'bcrypt';
import { promisify } from 'util';

import { User } from '../../../src/common/models/user';
import { DatabaseService } from '../database/database.service';

@Injectable()
export class AuthService {
  constructor(
    private readonly database: DatabaseService,
  ) {
  }

  /**
   * Checks that a user/password pair exists in the database
   * @async
   * @param {string} usernameValue
   * @param {string} passwordValue
   *
   * @return {Promise<User|null>} promise - a promise with the validation results. If successful
   * will return the user, otherwise it returns null.
   */
  async validateUser(usernameValue: string, passwordValue: string): Promise<User | null> {
    const databaseUser: User = await this.database.users.findOne({ username: usernameValue });
    if (!databaseUser || !databaseUser.enabled)
      return null;
    // make sure we do not return the password
    const { password, ...user } = databaseUser;
    const passwordMatch = await promisify(bcrypt.compare)(
      passwordValue,
      password,
    );

    if (!passwordMatch) {
      return null;
    }

    return user;
  }
}
