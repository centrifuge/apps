import { Body, Controller, Get, Post, UseGuards } from '@nestjs/common';
import { Invoice } from '../../../src/common/models/dto/invoice';
import { InvoicesService } from './invoices.service';
import { ROUTES } from '../../../src/common/constants';
import { SessionGuard } from '../auth/SessionGuard';

@Controller(ROUTES.INVOICES)
@UseGuards(SessionGuard)
export class InvoicesController {
  constructor(private readonly invoicesService: InvoicesService) {}

  @Post()
  async create(@Body() invoice: Invoice) {
    return await this.invoicesService.create(invoice);
  }

  @Get()
  async get() {
    return this.invoicesService.get();
  }
}
