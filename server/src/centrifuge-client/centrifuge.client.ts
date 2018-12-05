import { tokens } from './centrifuge.constants';
import { DocumentServiceApi } from '../../../clients/centrifuge-node/generated-client';

// TODO: read this from config
const basePath = 'https://localhost:8082';

export const centrifugeClientFactory = {
  provide: tokens.centrifugeClientFactory,
  useFactory: () => {
    return new DocumentServiceApi({ basePath });
  },
};
