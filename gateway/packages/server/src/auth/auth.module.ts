import { Module } from '@nestjs/common';
import { PassportModule } from '@nestjs/passport';
import { AuthService } from './auth.service';
import { LocalStrategy } from './local.strategy';
import { DatabaseModule } from '../database/database.module';
import { TwoFAStrategy } from './2fa.strategy';
import { JwtModule } from '@nestjs/jwt';
import { JwtStrategy } from './jwt.strategy';
import config from '../config';

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
