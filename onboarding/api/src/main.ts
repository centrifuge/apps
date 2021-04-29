import { NestFactory } from '@nestjs/core'
import { config as dotenv } from 'dotenv'
import { AppModule } from './app.module'
import * as Sentry from '@sentry/node'
import config from './config'

async function bootstrap() {
  if (config.sentryDsn) {
    Sentry.init({
      dsn: config.sentryDsn,
    })
  }

  const app = await NestFactory.create(AppModule)
  app.enableCors()

  await app.listen(3100)
}

bootstrap()
