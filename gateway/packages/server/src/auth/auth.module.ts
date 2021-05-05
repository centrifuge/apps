import { Module } from '@nestjs/common'
import { JwtModule } from '@nestjs/jwt'
import { PassportModule } from '@nestjs/passport'
import config from '../config'
import { DatabaseModule } from '../database/database.module'
import { TwoFAStrategy } from './2fa.strategy'
import { AuthService } from './auth.service'
import { JwtStrategy } from './jwt.strategy'
import { LocalStrategy } from './local.strategy'

@Module({
  imports: [
    PassportModule.register({ session: false }),
    DatabaseModule,
    JwtModule.register({
      secret: config.jwtPubKey,
      signOptions: { expiresIn: config.jwtExpiresIn },
    }),
  ],
  providers: [AuthService, JwtStrategy, LocalStrategy, TwoFAStrategy],
})
export class AuthModule {}
