import {
  AccountServiceApi,
  DocumentServiceApi, InvoiceServiceApi, PurchaseOrderServiceApi,
} from '../../../clients/centrifuge-node';

export class CentrifugeService {
  constructor(
    public accounts: AccountServiceApi,
    public documents: DocumentServiceApi,
    public invoices: InvoiceServiceApi,
    public purchaseOrders: PurchaseOrderServiceApi,
  ){}
}
