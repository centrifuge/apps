import { promisify } from 'util';
import * as bcrypt from 'bcrypt';
import { User } from '../../../src/common/models/user';
import { DatabaseRepository } from './database.repository';
import { Contact } from '../../../src/common/models/contact';
import config from '../config';
import {
  InvoiceResponse,
  PurchaseOrderResponse,
} from '../../../src/interfaces';
import { ROLE } from '../../../src/common/constants';
import { DatabaseService } from './database.service';

// TODO refactor this in mutiple providers,services



/**
 * Initialize the database and the separate collections.
 */
const initializeDatabase = async () => {
  const invoicesRepository = new DatabaseRepository<InvoiceResponse>(
    `${config.dbPath}/invoicesDb`,
  );
  const usersRepository =  new DatabaseRepository<User>(
    `${config.dbPath}/usersDb`,
  );
  const admin: User = {
    username: config.admin.username,
    password: await promisify(bcrypt.hash)(config.admin.password, 10),
    enabled: true,
    invited: false,
    account: config.admin.account,
    permissions: [ROLE.CAN_INVITE, ROLE.CAN_MANAGE_USERS, ROLE.CAN_MANAGE_ACCOUNTS],
  };

  const userExists = await usersRepository.findOne({
    username: admin.username,
  });

  if (!userExists) {
    await usersRepository.insert(admin);
  }

  const contactsRepository =  new DatabaseRepository<Contact>(
    `${config.dbPath}/contactsDb`,
  );

  const purchaseOrdersRepository =  new DatabaseRepository<PurchaseOrderResponse>(
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

