import { Module } from '@nestjs/common';
import { CentrifugeService } from './centrifuge.service';
import { MockCentrifugeService } from './centrifuge-client.mock';
import config from '../config';

function checkNodeEnvironment() {
  switch (process.env.NODE_ENV) {
    case 'test': {
      return new MockCentrifugeService();
    }
  }
  return new CentrifugeService();
}

export const centrifugeServiceProvider = {
  provide: CentrifugeService,
  useValue: checkNodeEnvironment(),
};

@Module({
  providers: [centrifugeServiceProvider],
  exports: [centrifugeServiceProvider],
})
export class CentrifugeModule {
}
