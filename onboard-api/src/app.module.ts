import { Module } from '@nestjs/common'
import { AppController } from './app.controller'
import { SecuritizeService } from './securitize.service'

@Module({
  imports: [],
  controllers: [AppController],
  providers: [SecuritizeService],
})
export class AppModule {}
