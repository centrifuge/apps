import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
import * as path from 'path';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);

  app
    .setViewEngine('html')
    .setBaseViewsDir(path.resolve('./frontend/build'))
    .useStaticAssets(path.resolve('./frontend/build'));

  await app.listen(3000);
}
bootstrap();
