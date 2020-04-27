import { promisify } from 'util';
import * as bcrypt from 'bcrypt';
import { User } from '@centrifuge/gateway-lib/models/user';
import { DatabaseRepository } from './database.repository';
import { Contact } from '@centrifuge/gateway-lib/models/contact';
import { Schema } from '@centrifuge/gateway-lib/models/schema';
import config from '../config';
import { DatabaseService } from './database.service';
import { DocumentRequest } from '@centrifuge/gateway-lib/models/document';

// TODO refactor this in mutiple providers,services

/**
 * Initialize the database and the separate collections.
 */
const initializeDatabase = async (inMemoryOnly: boolean) => {

  const usersRepository = new DatabaseRepository<User>(
    { filename: `${config.dbPath}/usersDb`, inMemoryOnly },
  );
  const admin: User = {
    name: config.admin.name,
    password: await promisify(bcrypt.hash)(config.admin.password, 10),
    email: config.admin.email,
    enabled: true,
    invited: false,
    schemas: [],
    account: config.admin.account,
    chain: config.admin.chain,
    permissions: config.admin.permissions,
  };

  const userExists = await usersRepository.findOne({
    email: admin.email,
  });

  if (!userExists) {
    await usersRepository.insert(admin);
  }

  const contactsRepository = new DatabaseRepository<Contact>(
    { filename: `${config.dbPath}/contactsDb`, inMemoryOnly },
  );

  const schemasRepository = new DatabaseRepository<Schema>(
    { filename: `${config.dbPath}/schemasDb`, inMemoryOnly },
  );

  const documentsRepository = new DatabaseRepository<DocumentRequest>(
      { filename: `${config.dbPath}/documentsDb`, inMemoryOnly },
  );

  return {
    users: usersRepository,
    contacts: contactsRepository,
    schemas: schemasRepository,
    documents: documentsRepository,
  };
};

/**
 * Initialize database lock. Used in order to provide a singleton connection to the database.
 */
let initializeDatabasePromise;

export const databaseServiceProvider = {
  provide: DatabaseService,
  useFactory: async (): Promise<DatabaseService> => {

    let testingMode: boolean;
    if (process.env.NODE_ENV === 'test' || process.env.NODE_ENV === 'functional') {
      testingMode = true;
    }
    if (!initializeDatabasePromise || testingMode) {
      initializeDatabasePromise = initializeDatabase(testingMode);
    }

    return initializeDatabasePromise;
  },
};
