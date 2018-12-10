import { Inject, Injectable } from '@nestjs/common';
import { PassportSerializer } from '@nestjs/passport';
import { User } from '../../../src/common/models/dto/user';
import { DatabaseProvider } from '../database/database.providers';
import { tokens } from '../database/database.constants';

@Injectable()
export class CookieSerializer extends PassportSerializer {
  constructor(
    @Inject(tokens.databaseConnectionFactory)
    private readonly databaseService: DatabaseProvider,
  ) {
    super();
  }

  serializeUser(user: User, done: Function): void {
    done(null, user.username);
  }

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
