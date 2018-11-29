import { Module } from '@nestjs/common';
import { PassportModule } from '@nestjs/passport';
import { AuthService } from './auth.service';
import { LocalStrategy } from './local.strategy';
import { UsersModule } from '../users/users.module';
import { CookieSerializer } from './cookie-serializer';

@Module({
  imports: [
    PassportModule.register({
      defaultStrategy: 'local',
    }),
    UsersModule,
  ],
  providers: [AuthService, LocalStrategy, CookieSerializer],
})
export class AuthModule {}
