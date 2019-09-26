import { Injectable } from '@nestjs/common';
import * as bcrypt from 'bcrypt';
import { promisify } from 'util';

import { User } from '@centrifuge/gateway-lib/models/user';
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
  async validateUser(emailValue: string, passwordValue: string): Promise<User | null> {
    const databaseUser: User = await this.database.users.findOne({ email: emailValue });
    if (!databaseUser || !databaseUser.enabled)
      return null;
    const passwordMatch = await promisify(bcrypt.compare)(
      passwordValue,
      databaseUser.password,
    );

    if (!passwordMatch) {
      return null;
    }
    return databaseUser;
  }
}
