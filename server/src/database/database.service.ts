import { DatabaseRepository } from './database.repository';
import { InvoiceResponse, PurchaseOrderResponse } from '../../../src/common/interfaces';
import { User } from '../../../src/common/models/user';
import { Contact } from '../../../src/common/models/contact';

export class DatabaseService {
  constructor(
    public invoices: DatabaseRepository<InvoiceResponse>,
    public users: DatabaseRepository<User>,
    public contacts: DatabaseRepository<Contact>,
    public purchaseOrders: DatabaseRepository<PurchaseOrderResponse>,
  ){}
}
