import { LocalStrategy } from './local.strategy';
import { UnauthorizedException } from '@nestjs/common';

import { AuthService } from './auth.service';
import { User } from '../../../src/common/models/user';
import { Test } from '@nestjs/testing';
import { dateToString } from '../../../src/common/formaters';

describe('LocalStrategy', () => {
  const mockUser: User = {
    name: 'my_username',
    password: 'my_password',
    email: 'test@test.com',
    date_added: dateToString(new Date()),
    account: '0x333',
    _id: 'my_id',
    enabled: true,
    invited: false,
    permissions: [],
  };

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
      mockUser.email,
      mockUser.password + '',
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
