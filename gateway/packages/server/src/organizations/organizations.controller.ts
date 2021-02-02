import { BadRequestException, Body, Controller, Get, Param, Post, Put, Req, UseGuards } from '@nestjs/common';
import { SessionGuard } from '../auth/SessionGuard';
import { ROUTES } from '@centrifuge/gateway-lib/utils/constants';
import { DatabaseService } from '../database/database.service';
import { Organization } from '@centrifuge/gateway-lib/models/organization';

@Controller(ROUTES.ORGANIZATIONS)
@UseGuards(SessionGuard)
export class OrganizationsController {
  constructor(
    private readonly databaseService: DatabaseService,
  ) {
  }

  @Post()
  /**
   * Create a organization
   * @async
   * @param {Organization} organization - the body of the request
   * @return {Promise<Organization>} result
   */
  async create(@Body() organization: Organization) {
    try {
      Organization.validate(organization);
    } catch (err) {
      throw new BadRequestException(err.message);
    }

    const newOrg = new Organization(
      organization.name.trim(),
      organization.account.toLowerCase().trim()
    );
    return await this.databaseService.organizations.insert(newOrg);
  }

  @Get()
  /**
   * Get the list of all organizations
   * @async
   * @param {Request} request - The http request
   * @return {Promise<Contact[]>} result
   */
  async get(@Req() request) {
    return this.databaseService.organizations.getCursor().sort({ updatedAt: -1 }).exec();
  }

  @Put(':id')
  /**
   * Update a contact by id, provided as a query parameter
   * @async
   * @param {any} params - the request parameters
   * @param {Organization} organization - the update object for the contact
   * @param {Request} request - the http request
   * @return {Promise<Organization>} result
   */
  async updateById(
    @Param() params,
    @Body() organization: Partial<Organization>,
    @Req() request,
  ) {
    return this.databaseService.organizations.update(
      { _id: params.id,  },
      { ...organization, },
    );
  }
}
