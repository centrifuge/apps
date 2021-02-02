import { Module } from '@nestjs/common';
import { PassportModule } from '@nestjs/passport';
import { DatabaseModule } from '../database/database.module';
import { TwoFAStrategy } from './2fa.strategy';
import { UserAuthGuard } from './admin.auth.guard';
import { AuthService } from './auth.service';
import { CookieSerializer } from './cookie-serializer';
import { LocalStrategy } from './local.strategy';

@Module({
  imports: [PassportModule.register({}), DatabaseModule],
  providers: [
    AuthService,
    LocalStrategy,
    TwoFAStrategy,
    UserAuthGuard,
    CookieSerializer,
  ],
})
export class AuthModule {}
