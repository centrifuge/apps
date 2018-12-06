import { Test } from '@nestjs/testing';

import { AuthService } from './auth.service';
import { User } from '../../../src/common/models/dto/user';
import { UsersService } from '../users/users.service';

describe('LocalStrategy', function() {
  const unhashedPassword = 'my_password';
  const mockUser = new User(
    'my_username',
    '$2b$12$qI.Lyik/2lJvLwfK74xFee7mOVWyKm0K20YPv4zlfis2dNOh2LJdO',
    'user_id',
  );
  let authService: AuthService;

  beforeEach(async () => {
    const mockUsersService = {
      findByUsername: jest.fn(username =>
        username === mockUser.username ? mockUser : null,
      ),
    };

    const module = await Test.createTestingModule({
      providers: [AuthService, UsersService],
    })
      .overrideProvider(UsersService)
      .useValue(mockUsersService)
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
