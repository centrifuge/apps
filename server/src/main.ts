import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
import * as path from 'path';
import * as session from 'express-session';
import * as passport from 'passport';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);

  app.use(
    session({
      secret: 'centrifuge',
      resave: false,
      saveUninitialized: false
    }),
  );

  app.use(passport.initialize());
  app.use(passport.session());

  app
    .setViewEngine('html')
    .setBaseViewsDir(path.resolve('./build'))
    .useStaticAssets(path.resolve('./build'));

  await app.listen(3001);
}
bootstrap();
