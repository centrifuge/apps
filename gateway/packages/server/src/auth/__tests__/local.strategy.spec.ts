import { UnauthorizedException } from '@nestjs/common';
import { Test } from '@nestjs/testing';
import { User } from '@centrifuge/gateway-lib/models/user';
import { DatabaseService } from '../../database/database.service';
import { AuthService } from '../auth.service';
import { LocalStrategy } from '../local.strategy';

describe('LocalStrategy', () => {
  const mockUser: User = {
    ...new User(),
    name: 'my_username',
    password: 'my_password',
    email: 'test@test.com',
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
      providers: [AuthService, DatabaseService, LocalStrategy],
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
      providers: [AuthService, DatabaseService, LocalStrategy],
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
