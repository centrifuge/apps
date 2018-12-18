import { tokens } from './centrifuge.constants';
import { DocumentServiceApi } from '../../../clients/centrifuge-node/generated-client';
import config from '../config';

// set up singleton centrifuge node client
const centrifugeClient = new DocumentServiceApi({
  basePath: config.centrifugeUrl,
});

export const centrifugeClientFactory = {
  provide: tokens.centrifugeClientFactory,
  useFactory: () => {
    return centrifugeClient;
  },
};
