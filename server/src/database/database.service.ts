import { DatabaseRepository } from './database.repository';
import { User } from '../../../src/common/models/user';
import { Contact } from '../../../src/common/models/contact';
import { Schema } from '../../../src/common/models/schema';
import { Document } from '../../../src/common/models/document';

export class DatabaseService {
  constructor(
    public users: DatabaseRepository<User>,
    public contacts: DatabaseRepository<Contact>,
    public schemas: DatabaseRepository<Schema>,
    public documents: DatabaseRepository<Document>,
  ) {
  }
}
