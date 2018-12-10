import {
  Body,
  Controller,
  Get,
  Inject,
  Post,
  Req,
  UseGuards,
} from '@nestjs/common';
import { SessionGuard } from '../auth/SessionGuard';
import { Contact } from '../../../src/common/models/dto/contact';
import { ROUTES } from '../../../src/common/constants';
import { DatabaseProvider } from '../database/database.providers';
import { tokens as databaseTokens } from '../database/database.constants';

@Controller(ROUTES.CONTACTS)
@UseGuards(SessionGuard)
export class ContactsController {
  constructor(
    @Inject(databaseTokens.databaseConnectionFactory)
    private readonly databaseService: DatabaseProvider,
  ) {}

  @Post()
  async create(@Req() request, @Body() contact: Contact) {
    const newContact = new Contact(
      contact.name,
      contact.address,
      request.user.id,
    );
    return await this.databaseService.contacts.create(newContact);
  }

  @Get()
  async get(@Req() request) {
    return await this.databaseService.contacts.find({
      ownerId: request.user.id,
    });
  }
}
