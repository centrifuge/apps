import { Injectable } from '@nestjs/common';
import * as bcrypt from 'bcrypt';
import { promisify } from 'util';

import { UsersService } from '../users/users.service';
import { User } from '../../../src/common/models/dto/user';

@Injectable()
export class AuthService {
  constructor(private readonly usersService: UsersService) {}

  async validateUser(username: string, password: string): Promise<User | null> {
    const user = await this.usersService.findByUsername(username);
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
