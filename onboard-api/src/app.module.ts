import { Module } from '@nestjs/common'
import { AppController } from './app.controller'
import { SecuritizeService } from './securitize.service'
import { DocusignService } from './docusign.service'

@Module({
  imports: [],
  controllers: [AppController],
  providers: [SecuritizeService, DocusignService],
})
export class AppModule {}
