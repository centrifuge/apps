import { Body, Controller, Get, Post } from '@nestjs/common';
import { CreateInvoiceDto } from './dto/create-invoice.dto';
import { InvoicesService } from './invoices.service';
import { API_BASE } from '../constants';

@Controller(`${API_BASE}/invoices`)
export class InvoicesController {
  constructor(private readonly invoicesService: InvoicesService) {}

  @Post()
  async create(@Body() createInvoiceDto: CreateInvoiceDto) {
    return await this.invoicesService.create(createInvoiceDto);
  }

  @Get()
  async get() {
    return this.invoicesService.get();
  }
}
