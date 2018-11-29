import { Injectable } from '@nestjs/common';
import { PassportSerializer } from '@nestjs/passport';
import { User } from '../../../src/common/models/dto/user';
import { UsersService } from '../users/users.service';

@Injectable()
export class CookieSerializer extends PassportSerializer {
  constructor(private readonly usersService: UsersService) {
    super();
  }

  serializeUser(user: User, done: Function): void {
    done(null, user.username);
  }

  async deserializeUser(username: string, done: Function): Promise<void> {
    try {
      const dbUser = await this.usersService.findByUsername(username);
      return done(null, dbUser);
    } catch (err) {
      done(err);
    }
  }
}
