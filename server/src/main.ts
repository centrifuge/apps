import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
import * as path from 'path';
import * as session from 'express-session';
import * as passport from 'passport';
import config from '../../src/common/config';

// accept self-signed certificate
process.env['NODE_TLS_REJECT_UNAUTHORIZED'] = '0';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);

  // set up the express session storage
  app.use(
    session({
      secret: config.sessionSecret,
      resave: false,
      saveUninitialized: false,
    }),
  );

  // set up passport
  app.use(passport.initialize());
  app.use(passport.session());


  // When the build is production the application serves the assets built by create-react-app
  app.setViewEngine('html')
  app.engine('html', require('hbs').__express);
  app.setBaseViewsDir(path.resolve('./build'));
  app.useStaticAssets(path.resolve('./build'),{index:false});

  const server = await app.listen(3001);
  server.setTimeout(0);
}

bootstrap();
