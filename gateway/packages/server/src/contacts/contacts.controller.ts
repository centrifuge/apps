import {
  BadRequestException,
  Body,
  Controller,
  Get,
  Param,
  Post,
  Put,
  Req,
  UseGuards,
} from '@nestjs/common';
import { Contact } from '@centrifuge/gateway-lib/models/contact';
import { ROUTES } from '@centrifuge/gateway-lib/utils/constants';
import { DatabaseService } from '../database/database.service';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';

@Controller(ROUTES.CONTACTS)
@UseGuards(JwtAuthGuard)
export class ContactsController {
  constructor(private readonly databaseService: DatabaseService) {}

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
      throw new BadRequestException(err.message);
    }

    const newContact = new Contact(
      contact.name.trim(),
      contact.address.toLowerCase().trim(),
      request.user._id,
    );
    return await this.databaseService.contacts.insert(newContact);
  }

  @Get()
  /**
   * Get the list of all contacts for the authenticated user
   * @async
   * @param {Request} request - The http request
   * @return {Promise<Contact[]>} result
   */
  async get(@Req() request) {
    return this.databaseService.contacts
      .getCursor({
        ownerId: request.user._id,
      })
      .sort({ updatedAt: -1 })
      .exec();
  }

  @Put(':id')
  /**
   * Update a contact by id, provided as a query parameter
   * @async
   * @param {any} params - the request parameters
   * @param {Contact} updateContactObject - the update object for the contact
   * @param {Request} request - the http request
   * @return {Promise<Contact>} result
   */
  async updateById(
    @Param() params,
    @Body() updateContactObject: Contact,
    @Req() request,
  ) {
    return this.databaseService.contacts.update(
      { _id: params.id, ownerId: request.user._id },
      { ...updateContactObject, ownerId: request.user._id },
    );
  }
}
