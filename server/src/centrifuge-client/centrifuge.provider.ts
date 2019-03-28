
import {
  AccountServiceApi,
  DocumentServiceApi,
} from '../../../clients/centrifuge-node/generated-client';
import config from '../config';
import { CentrifugeService } from './centrifuge.service';

const documentsClient = new DocumentServiceApi({}, config.centrifugeUrl);

const accountsClient = new AccountServiceApi({}, config.centrifugeUrl);

export const centrifugeServiceProvider = {
  provide: CentrifugeService,
  useFactory: (): CentrifugeService => {
    return {
      documents: documentsClient,
      accounts: accountsClient,
    };
  },
};
