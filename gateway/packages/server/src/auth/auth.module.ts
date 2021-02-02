import { Module } from '@nestjs/common';
import { PassportModule } from '@nestjs/passport';
import { AuthService } from './auth.service';
import { LocalStrategy } from './local.strategy';
import { CookieSerializer } from './cookie-serializer';
import { DatabaseModule } from '../database/database.module';
import {UserAuthGuard} from './admin.auth.guard';
import { TwoFAStrategy } from './2fa.strategy';

@Module({
  imports: [
    PassportModule.register({}),
    DatabaseModule,
  ],
  providers: [
    AuthService,
    LocalStrategy,
    TwoFAStrategy,
    UserAuthGuard,
    CookieSerializer,
  ],
})
export class AuthModule {}
