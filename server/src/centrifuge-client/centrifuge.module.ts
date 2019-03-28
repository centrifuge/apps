import { Module } from '@nestjs/common';
import { centrifugeServiceProvider } from './centrifuge.provider';

@Module({
  providers: [centrifugeServiceProvider],
  exports: [centrifugeServiceProvider],
})
export class CentrifugeModule {
}
