import { Inject, Injectable } from '@nestjs/common';
import { DatabaseRepository } from '../database/database.repository';
import { tokens } from './invoices.constants';
import { InvoiceInvoiceData } from '../../../clients/centrifuge-node/generated-client';

@Injectable()
export class InvoicesService {
  constructor(
    @Inject(tokens.invoicesRepository)
    private readonly invoicesRepository: DatabaseRepository<InvoiceInvoiceData>,
  ) {}

  async create(invoice: InvoiceInvoiceData) {
    return await this.invoicesRepository.create(invoice);
  }

  async get() {
    return await this.invoicesRepository.get();
  }
}
