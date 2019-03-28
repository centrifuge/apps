import { Test } from '@nestjs/testing';

import { AuthService } from './auth.service';
import { User } from '../../../src/common/models/user';
import { databaseServiceProvider } from '../database/database.providers';
import { DatabaseService } from '../database/database.service';

describe('LocalStrategy', function() {
  const unhashedPassword = 'my_password';
  const mockUser: User = {
    username: 'my_username',
    password: '$2b$12$qI.Lyik/2lJvLwfK74xFee7mOVWyKm0K20YPv4zlfis2dNOh2LJdO',
    _id: 'user_id',
    enabled: true,
    invited: false,
    permissions: [],
  };

  let authService: AuthService;

  beforeEach(async () => {
    class DatabaseServiceMock {
      users = {
        findOne: jest.fn(() => mockUser),
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
      mockUser.username,
      unhashedPassword,
    );
    expect(result).toBe(mockUser);
  });

  it('should return null if username is invalid', async () => {
    const result = await authService.validateUser(
      'invalid username',
      mockUser.password,
    );
    expect(result).toBe(null);
  });

  it('should return null if password is invalid', async () => {
    const result = await authService.validateUser(
      mockUser.username,
      'invalid password',
    );
    expect(result).toBe(null);
  });
});
