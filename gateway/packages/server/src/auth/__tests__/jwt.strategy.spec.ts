import { User } from '@centrifuge/gateway-lib/src/models/user'
import { UnauthorizedException } from '@nestjs/common'
import { JwtModule, JwtService } from '@nestjs/jwt'
import { Test } from '@nestjs/testing'
import config from '../../config'
import { AuthService } from '../auth.service'
import { JWTPayload } from '../jwt-payload.interface'
import { JwtStrategy } from '../jwt.strategy'

describe('JWTStrategy', () => {
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

  let jwtService: JwtService
  let jwtStrategy: JwtStrategy

  beforeEach(async () => {
    const mockAuthService = {
      validateUserByEmail: jest.fn((email) => (email === mockUser.email ? mockUser : null)),
    }
    const module = await Test.createTestingModule({
      imports: [
        JwtModule.register({
          // secret: config.jwtPubKey,
          signOptions: { expiresIn: '1h' }, // TODO discuss
        }),
      ],
      providers: [AuthService, JwtStrategy],
    })
      .overrideProvider(AuthService)
      .useValue(mockAuthService)
      .compile()

    jwtService = module.get<JwtService>(JwtService)
    jwtStrategy = module.get<JwtStrategy>(JwtStrategy)
  })

  it('should return user validation succeeds', async () => {
    const result = await jwtStrategy.validate({
      sub: mockUser.email,
      poolIds: [],
    })
    expect(result).toBe(mockUser)
  })

  it('should throw when validation fails', async () => {
    await expect(
      jwtStrategy.validate({
        sub: mockUser.email + 'fail',
        poolIds: [],
      })
    ).rejects.toThrow(UnauthorizedException)
  })

  it('sign and verify', async () => {
    const payload: JWTPayload = { sub: mockUser.email, poolIds: ['0xab'] }
    const token = await jwtService.signAsync(payload, {
      algorithm: 'RS256',
      secret: config.jwtPrivKey,
    })

    await expect(
      jwtService.verifyAsync(token, {
        algorithms: ['RS256'],
        secret: config.jwtPubKey + 'a',
      })
    ).rejects.toThrow()

    const result = await jwtService.verifyAsync(token, {
      algorithms: ['RS256'],
      secret: config.jwtPubKey,
    })

    expect(result).toMatchObject(payload)
  })
})
