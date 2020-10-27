import { MiddlewareConsumer, Module, NestModule } from '@nestjs/common';
import { UsersController } from './users.controller';
import { DatabaseModule } from '../database/database.module';
import * as passport from 'passport';
import { ROUTES } from '@centrifuge/gateway-lib/utils/constants';
import { CentrifugeModule } from '../centrifuge-client/centrifuge.module';
import {AuthModule} from '../auth/auth.module';
@Module({
  controllers: [UsersController],
  providers: [],
  imports: [DatabaseModule, AuthModule, CentrifugeModule],
})
export class UsersModule implements NestModule {
  configure(consumer: MiddlewareConsumer): MiddlewareConsumer | void {
    consumer
      .apply(passport.authenticate('local'))
      .forRoutes(`${ROUTES.USERS.generateToken}`);

    consumer
      .apply(passport.authenticate(process.env.NODE_ENV === 'development'? 'local':'2fa'))
      .forRoutes(`${ROUTES.USERS.login}`);
  }
}
