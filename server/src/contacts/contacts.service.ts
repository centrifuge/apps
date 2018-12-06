import { Inject, Injectable } from '@nestjs/common';
import { tokens } from './contacts.constants';
import { DatabaseRepository } from '../database/database.repository';
import { Contact } from '../../../src/common/models/dto/contact';

@Injectable()
export class ContactsService {
  constructor(
    @Inject(tokens.contactsRepository)
    private readonly contactsRepository: DatabaseRepository<Contact>,
  ) {}

  async create(contact: Contact) {
    return await this.contactsRepository.create(contact);
  }

  async get(ownerId: string) {
    return await this.contactsRepository.find({ ownerId });
  }
}
