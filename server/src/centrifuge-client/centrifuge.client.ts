import { tokens } from './centrifuge.constants';
import { DocumentServiceApi } from '../../../clients/centrifuge-node/generated-client';
import config from '../config';
import * as portableFetch from 'portable-fetch';

const fetchWithHeaders = (url, options = { headers: {} }, ...rest) => {
  return portableFetch(
    url,
    {
      ...(options && options),
      headers: {
        Authorization: config.centrifugeId,
      },
      ...(options && options.headers && options.headers),
    },
    ...rest,
  );
};

// set up singleton centrifuge node client
const centrifugeClient = new DocumentServiceApi(
  {},
  config.centrifugeUrl,
  fetchWithHeaders,
);

export const centrifugeClientFactory = {
  provide: tokens.centrifugeClientFactory,
  useFactory: () => {
    return centrifugeClient;
  },
};
