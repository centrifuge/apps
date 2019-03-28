import { Inject, Injectable } from '@nestjs/common';
import { PassportSerializer } from '@nestjs/passport';
import { User } from '../../../src/common/models/user';
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
   * @param {string} username
   */

  /**
   * Serializes a user by their username
   * @param {User} user - the user to serialize
   * @param {CookieSerializer~serializeUserCallback} done
   */
  serializeUser(user: User, done: Function): void {
    done(null, user.username);
  }

  /**
   * Callback for serializing a user
   * @callback CookieSerializer~deserializeUserCallback
   * @param {Error|null} error
   * @param {User} user
   */

  /**
   * Deserializes a user by specifying a username
   * @async
   * @param {string} username
   * @param {CookieSerializer~deserializeUserCallback} done
   */
  async deserializeUser(username: string, done: Function): Promise<void> {
    try {
      const user = await this.databaseService.users.findOne({
        username,
      });

      return done(null, user);
    } catch (err) {
      done(err);
    }
  }
}
