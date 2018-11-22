export class CreateInvoiceDto {
  constructor(readonly invoiceNumber: number, readonly senderName: string) {}
}
