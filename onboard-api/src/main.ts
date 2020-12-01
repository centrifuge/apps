import { NestFactory } from '@nestjs/core'
import * as cookieParser from 'cookie-parser'
import { config } from 'dotenv'
import { AppModule } from './app.module'

async function bootstrap() {
  config()

  const app = await NestFactory.create(AppModule)
  app.enableCors()
  app.use(cookieParser())

  await app.listen(3100)
}

bootstrap()
