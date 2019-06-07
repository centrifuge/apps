import { promisify } from 'util';
import * as bcrypt from 'bcrypt';
import { User } from '../../../src/common/models/user';
import { DatabaseRepository } from './database.repository';
import { Contact } from '../../../src/common/models/contact';
import config from '../../../src/common/config';
import { InvoiceResponse, PurchaseOrderResponse } from '../../../src/common/interfaces';
import { DatabaseService } from './database.service';
import { dateToString } from '../../../src/common/formaters';

// TODO refactor this in mutiple providers,services


/**
 * Initialize the database and the separate collections.
 */
const initializeDatabase = async () => {
  const invoicesRepository = new DatabaseRepository<InvoiceResponse>(
    `${config.dbPath}/invoicesDb`,
  );
  const usersRepository = new DatabaseRepository<User>(
    `${config.dbPath}/usersDb`,
  );
  const admin: User = {
    name: config.admin.name,
    password: await promisify(bcrypt.hash)(config.admin.password, 10),
    email: config.admin.email,
    date_added: dateToString(new Date()),
    enabled: true,
    invited: false,
    account: config.admin.account,
    permissions: config.admin.permissions,
  };

  const userExists = await usersRepository.findOne({
    email: admin.email,
  });

  if (!userExists) {
    await usersRepository.insert(admin);
  }

  const contactsRepository = new DatabaseRepository<Contact>(
    `${config.dbPath}/contactsDb`,
  );

  const purchaseOrdersRepository = new DatabaseRepository<PurchaseOrderResponse>(
    `${config.dbPath}/purchaseOrdersDb`,
  );

  return {
    invoices: invoicesRepository,
    users: usersRepository,
    contacts: contactsRepository,
    purchaseOrders: purchaseOrdersRepository,
  };
};

/**
 * Initialize database lock. Used in order to provide a singleton connection to the database.
 */
let initializeDatabasePromise;


export const databaseServiceProvider = {
  provide: DatabaseService,
  useFactory: async (): Promise<DatabaseService> => {
    if (!initializeDatabasePromise) {
      initializeDatabasePromise = initializeDatabase();
    }

    return initializeDatabasePromise;
  },
};

