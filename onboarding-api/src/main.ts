import { NestFactory } from '@nestjs/core'
import * as Sentry from '@sentry/node'
import { AppModule } from './app.module'
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
