import { Inject, Injectable } from '@nestjs/common';
import { CreateInvoiceDto } from './dto/create-invoice.dto';
import { DatabaseRepository } from '../database/database.repository';
import { tokens } from './invoices.constants';

@Injectable()
export class InvoicesService {
  constructor(
    @Inject(tokens.invoicesRepository)
    private readonly invoicesRepository: DatabaseRepository<CreateInvoiceDto>,
  ) {}

  async create(invoice: CreateInvoiceDto) {
    return await this.invoicesRepository.create(invoice);
  }

  async get() {
    return await this.invoicesRepository.get();
  }
}
