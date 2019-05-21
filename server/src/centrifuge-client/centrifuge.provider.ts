
import {
  AccountServiceApi,
  DocumentServiceApi, InvoiceServiceApi, PurchaseOrderServiceApi,
} from '../../../clients/centrifuge-node';
import config from '../../../src/common/config';
import { CentrifugeService } from './centrifuge.service';

const documentsClient = new DocumentServiceApi({}, config.centrifugeUrl);
const accountsClient = new AccountServiceApi({}, config.centrifugeUrl);
const invoiceClient = new InvoiceServiceApi({}, config.centrifugeUrl);
const purchaseOrderClient = new PurchaseOrderServiceApi({}, config.centrifugeUrl);

export const centrifugeServiceProvider = {
  provide: CentrifugeService,
  useFactory: (): CentrifugeService => {
    return {
      documents: documentsClient,
      accounts: accountsClient,
      invoices: invoiceClient,
      purchaseOrders: purchaseOrderClient,
    };
  },
};
