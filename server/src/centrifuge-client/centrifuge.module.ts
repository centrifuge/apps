import { Module } from '@nestjs/common';
import { CentrifugeService } from './centrifuge.service';
import { MockCentrifugeService } from "./centrifuge-client.mock";
import config from "../../../src/common/config";

function checkNodeEnvironment(){
  switch(process.env.NODE_ENV) {
    case 'test': {
      return new MockCentrifugeService()
    }
    case 'functional': {
      config.centrifugeUrl = 'http://127.0.0.1:8084'
      return new CentrifugeService()
    }
    return new CentrifugeService()
  }
}

export const centrifugeServiceProvider = {
  provide: CentrifugeService,
  useValue: checkNodeEnvironment()
};

@Module({
  providers: [centrifugeServiceProvider],
  exports: [centrifugeServiceProvider],
})
export class CentrifugeModule {}
