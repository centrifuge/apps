import {
  AccountServiceApi,
  DocumentServiceApi,
} from '../../../clients/centrifuge-node/generated-client';

export class CentrifugeService {
  constructor(
    public accounts: AccountServiceApi,
    public documents: DocumentServiceApi,
  ){}
}
