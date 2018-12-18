import {
  Body,
  Controller,
  Get,
  HttpException,
  HttpStatus,
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
  /**
   * Create a contact in the currently authenticated user's address book
   * @async
   * @param {Request} request - the http request
   * @param {Contact} contact - the body of the request
   * @return {Promise<Contact>} result
   */
  async create(@Req() request, @Body() contact: Contact) {
    try {
      Contact.validate(contact);
    } catch (err) {
      throw new HttpException(err.message, HttpStatus.BAD_REQUEST);
    }

    const newContact = new Contact(
      contact.name,
      contact.address,
      request.user.id,
    );
    return await this.databaseService.contacts.create(newContact);
  }

  @Get()
  /**
   * Get the list of all contacts for the authenticated user
   * @async
   * @param {Promise<Contact[]>} result
   */
  async get(@Req() request) {
    return await this.databaseService.contacts.find({
      ownerId: request.user.id,
    });
  }
}
