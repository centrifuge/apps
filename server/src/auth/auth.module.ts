import { Module } from '@nestjs/common';
import { PassportModule } from '@nestjs/passport';
import { AuthService } from './auth.service';
import { LocalStrategy } from './local.strategy';
import { CookieSerializer } from './cookie-serializer';
import { DatabaseModule } from '../database/database.module';
import {UserAuthGuard} from './admin.auth.guard';

@Module({
  imports: [
    PassportModule.register({
      defaultStrategy: 'local',
    }),
    DatabaseModule,
  ],
  providers: [
    AuthService,
    LocalStrategy,
    UserAuthGuard,
    CookieSerializer,
  ],
})
export class AuthModule {}
