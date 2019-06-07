import { Module } from '@nestjs/common';
import { CentrifugeService } from './centrifuge.service';

@Module({
  providers: [CentrifugeService],
  exports: [CentrifugeService],
})
export class CentrifugeModule {
}
