import { tokens } from './centrifuge.constants';
import { env } from 'process';
import { DocumentServiceApi } from '../../../clients/centrifuge-node/generated-client';

export const centrifugeClientFactory = {
  provide: tokens.centrifugeClientFactory,
  useFactory: () => {
    return new DocumentServiceApi({ basePath: env.CENTRIFUGE_URL || 'https://localhost:8082' });
  },
};
