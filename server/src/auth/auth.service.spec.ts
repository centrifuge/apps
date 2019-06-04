import { Test } from '@nestjs/testing';

import { AuthService } from './auth.service';
import { User } from '../../../src/common/models/user';
import { databaseServiceProvider } from '../database/database.providers';
import { DatabaseService } from '../database/database.service';
import { dateToString } from '../../../src/common/formaters';

describe('LocalStrategy', () => {
  const unhashedPassword = 'my_password';
  const hashedPassword = '$2b$12$qI.Lyik/2lJvLwfK74xFee7mOVWyKm0K20YPv4zlfis2dNOh2LJdO';
  const mockUser: User = {
    name: 'my_username',
    _id: 'user_id',
    email: 'test@test.test',
    date_added: dateToString(new Date()),
    account:"0x3333",
    enabled: true,
    invited: false,
    permissions: [],
  };

  let authService: AuthService;

  beforeEach(async () => {
    class DatabaseServiceMock {
      users = {
        findOne: jest.fn(() => ({
            ...mockUser,
            password: hashedPassword,
          }),
        ),
      };
    }

    const databaseServiceMock = new DatabaseServiceMock();

    const module = await Test.createTestingModule({
      providers: [AuthService, databaseServiceProvider],
    })
      .overrideProvider(DatabaseService)
      .useValue(databaseServiceMock)
      .compile();

    authService = module.get<AuthService>(AuthService);
  });

  it('should return user if credentials are valid', async () => {
    const result = await authService.validateUser(
      mockUser.name,
      unhashedPassword,
    );
    expect(result).toEqual({
      ...mockUser,
      password: hashedPassword,
    });
  });

  it('should return null if username is invalid', async () => {
    const result = await authService.validateUser(
      'invalid username',
      'mockUser.password',
    );
    expect(result).toBe(null);
  });

  it('should return null if password is invalid', async () => {
    const result = await authService.validateUser(
      mockUser.name,
      'invalid password',
    );
    expect(result).toBe(null);
  });
});
