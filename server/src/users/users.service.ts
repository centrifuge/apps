import { Inject, Injectable } from '@nestjs/common';
import { User } from '../../../src/common/models/dto/user';
import { DatabaseRepository } from '../database/database.repository';
import { tokens } from './users.constants';

@Injectable()
export class UsersService {
  constructor(
    @Inject(tokens.UsersRepository)
    private readonly usersRepository: DatabaseRepository<User>,
  ) {}

  async create(user: User) {
    return await this.usersRepository.create(user);
  }

  async get() {
    return await this.usersRepository.get();
  }

  async findByUsername(username: string) {
    return await this.usersRepository.findOne({ username });
  }
}
