import { NestFactory, Reflector } from '@nestjs/core';
import { AppModule } from './app.module';
import * as path from 'path';
import * as passport from 'passport';
import config from './config';
import { NestExpressApplication } from '@nestjs/platform-express';
import { ClassSerializerInterceptor } from '@nestjs/common';

// accept self-signed certificate
process.env.NODE_TLS_REJECT_UNAUTHORIZED = '1';

async function bootstrap() {
  const app = await NestFactory.create<NestExpressApplication>(AppModule);

  // set up passport
  app.use(passport.initialize());

  // register global interceptor for data serialization (e. g. exclude secrets from DTOs)
  app.useGlobalInterceptors(new ClassSerializerInterceptor(app.get(Reflector)));

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
