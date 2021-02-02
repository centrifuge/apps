import { User } from '@centrifuge/gateway-lib/models/user'
import { UnauthorizedException } from '@nestjs/common'
import { Test } from '@nestjs/testing'
import { DatabaseService } from '../../database/database.service'
import { TwoFAStrategy } from '../2fa.strategy'
import { AuthService } from '../auth.service'

describe('TwoFAStrategy', () => {
  const mockUser: User = {
    ...new User(),
    name: 'my_username',
    password: 'my_password',
    token: '12m3',
    email: 'test@test.com',
    account: '0x333',
    _id: 'my_id',
    enabled: true,
    invited: false,
    permissions: [],
  }

  it('should return user validation succeeds', async () => {
    const mockAuthService = {
      validateUserWithToken: jest.fn(() => mockUser),
    }
    const module = await Test.createTestingModule({
      providers: [AuthService, DatabaseService, TwoFAStrategy],
    })
      .overrideProvider(AuthService)
      .useValue(mockAuthService)
      .compile()

    const httpStrategy = module.get<TwoFAStrategy>(TwoFAStrategy)
    const result = await httpStrategy.validate(mockUser.email, mockUser.password, mockUser.token)
    expect(result).toBe(mockUser)
  })

  it('should throw when validation fails', async () => {
    const mockAuthService = {
      validateUserWithToken: jest.fn(() => null),
    }
    const module = await Test.createTestingModule({
      providers: [AuthService, DatabaseService, TwoFAStrategy],
    })
      .overrideProvider(AuthService)
      .useValue(mockAuthService)
      .compile()

    const httpStrategy = module.get<TwoFAStrategy>(TwoFAStrategy)

    await expect(httpStrategy.validate(mockUser.email, mockUser.password, mockUser.token)).rejects.toThrow(
      UnauthorizedException
    )
  })
})
