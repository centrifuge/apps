import { LocalStrategy } from './local.strategy';
import { UnauthorizedException } from '@nestjs/common';

import { AuthService } from './auth.service';
import { User } from '../../../src/common/models/dto/user';
import { Test } from '@nestjs/testing';

describe('LocalStrategy', function() {
  const mockUser = new User('my_username', 'my_password', 'my_id');

  it('should return user validation succeeds', async () => {
    const mockAuthService = {
      validateUser: jest.fn(() => mockUser),
    };
    const module = await Test.createTestingModule({
      providers: [AuthService, LocalStrategy],
    })
      .overrideProvider(AuthService)
      .useValue(mockAuthService)
      .compile();

    const httpStrategy = module.get<LocalStrategy>(LocalStrategy);
    const result = await httpStrategy.validate(
      mockUser.username,
      mockUser.password,
    );
    expect(result).toBe(mockUser);
  });

  it('should throw when validation fails', async () => {
    const mockAuthService = {
      validateUser: jest.fn(() => null),
    };
    const module = await Test.createTestingModule({
      providers: [AuthService, LocalStrategy],
    })
      .overrideProvider(AuthService)
      .useValue(mockAuthService)
      .compile();

    const httpStrategy = module.get<LocalStrategy>(LocalStrategy);

    await expect(
      httpStrategy.validate('some username', 'some password'),
    ).rejects.toThrow(UnauthorizedException);
  });
});
