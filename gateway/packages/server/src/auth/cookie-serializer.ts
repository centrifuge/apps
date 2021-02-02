import { Inject, Injectable } from '@nestjs/common';
import { PassportSerializer } from '@nestjs/passport';
import { User } from '@centrifuge/gateway-lib/models/user';
import { DatabaseService } from '../database/database.service';

@Injectable()
export class CookieSerializer extends PassportSerializer {
  constructor(
    private readonly databaseService: DatabaseService,
  ) {
    super();
  }

  /**
   * Callback for serializing a user
   * @callback CookieSerializer~serializeUserCallback
   * @param {Error|null} error
   * @param {string} email
   */

  /**
   * Serializes a user by their email
   * @param {User} user - the user to serialize
   * @param {CookieSerializer~serializeUserCallback} done
   */
  serializeUser(user: User, done: Function): void {
    done(null, user.email);
  }

  /**
   * Callback for serializing a user
   * @callback CookieSerializer~deserializeUserCallback
   * @param {Error|null} error
   * @param {User} user
   */

  /**
   * Deserializes a user by specifying an email
   * @async
   * @param {string} email
   * @param {CookieSerializer~deserializeUserCallback} done
   */
  async deserializeUser(email: string, done: Function): Promise<void> {
    try {
      const user = await this.databaseService.users.findOne({
        email,
      });

      return done(null, user);
    } catch (err) {
      done(err);
    }
  }
}
