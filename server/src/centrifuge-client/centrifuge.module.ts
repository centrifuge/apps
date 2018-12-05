import { Module } from '@nestjs/common';
import { centrifugeClientFactory } from './centrifuge.client';

@Module({
  providers: [centrifugeClientFactory],
  exports: [centrifugeClientFactory],
})
export class CentrifugeModule {}
