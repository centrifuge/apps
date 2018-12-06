import { Body, Controller, Get, Post, Req, UseGuards } from '@nestjs/common';
import { SessionGuard } from '../auth/SessionGuard';
import { ContactsService } from './contacts.service';
import { Contact } from '../../../src/common/models/dto/contact';
import { ROUTES } from '../../../src/common/constants';

@Controller(ROUTES.CONTACTS)
@UseGuards(SessionGuard)
export class ContactsController {
  constructor(private readonly contactsService: ContactsService) {}

  @Post()
  async create(@Req() request, @Body() contact: Contact) {
    const newContact = new Contact(
      contact.name,
      contact.address,
      request.user.id,
    );
    return await this.contactsService.create(newContact);
  }

  @Get()
  async get(@Req() request) {
    return await this.contactsService.get(request.user.id);
  }
}
