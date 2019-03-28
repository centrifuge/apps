import { MiddlewareConsumer, Module, NestModule } from '@nestjs/common';
import { UsersController } from './users.controller';
import { DatabaseModule } from '../database/database.module';
import * as passport from 'passport';
import { ROUTES } from '../../../src/common/constants';
import { CentrifugeModule } from '../centrifuge-client/centrifuge.module';

@Module({
  controllers: [UsersController],
  providers: [],
  imports: [DatabaseModule, CentrifugeModule],
})
export class UsersModule implements NestModule {
  configure(consumer: MiddlewareConsumer): MiddlewareConsumer | void {
    consumer
      .apply(passport.authenticate('local'))
      .forRoutes(`${ROUTES.USERS.login}`);
  }
}
