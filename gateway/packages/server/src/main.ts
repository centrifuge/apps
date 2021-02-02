import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
import * as path from 'path';
import * as session from 'express-session';
import * as passport from 'passport';
import config from './config';
import { NestExpressApplication } from '@nestjs/platform-express';

// accept self-signed certificate
process.env.NODE_TLS_REJECT_UNAUTHORIZED = '1';

async function bootstrap() {
  const app = await NestFactory.create<NestExpressApplication>(AppModule);

  // set up the express session storage
  app.use(
    session({
      secret: config.sessionSecret,
      resave: false,
      rolling: true,
      saveUninitialized: false,
      cookie: {
        maxAge: 3600000, // 1 hour
      },
    }),
  );

  // set up passport
  app.use(passport.initialize());
  app.use(passport.session());

  // When the build is production the application serves the assets built by create-react-app
  app.setViewEngine('html');
  app.engine('html', require('hbs').__express);
  app.setBaseViewsDir(path.resolve('./build'));
  app.useStaticAssets(path.resolve('./build'), { index: false });

  const server = await app.listen(config.applicationPort);
  console.log('PORT', config.applicationPort);
  server.setTimeout(0);
}

bootstrap();
