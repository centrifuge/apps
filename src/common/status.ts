import { InvoiceResponse } from './interfaces';

export enum STATUS {
  NO_STATUS = '',
  PENDING = 'Requested',
  ACCEPTED = 'Accepted',
  SETTLED = 'Settled',
  REPAID = 'Repaid',
  UNKNOWN = 'Unknown',
  REPAYING_FUNDING = 'Funding',
  SENDING_FUNDING = 'Repaying',
  FUNDED = 'Funded',

}

export const getInvoiceFundingStatus = (invoice: InvoiceResponse) => {

  if (invoice.fundingAgreement && invoice.fundingAgreement.signatures && invoice.transferDetails) {
    const fundingTransfer = invoice.transferDetails[0];
    const repaymentTransfer = invoice.transferDetails[1];
    if (fundingTransfer && fundingTransfer.status === 'opened' && !repaymentTransfer) {
      return STATUS.SENDING_FUNDING;
    } else if (fundingTransfer && fundingTransfer.status === 'settled' && !repaymentTransfer) {
      return STATUS.FUNDED;
    } else if (fundingTransfer && fundingTransfer.status === 'settled' && repaymentTransfer && repaymentTransfer.status === 'opened') {
      return STATUS.REPAYING_FUNDING;
    } else if (fundingTransfer && fundingTransfer.status === 'settled' && repaymentTransfer && repaymentTransfer.status === 'settled') {
      return STATUS.REPAID;
    } else {
      return STATUS.UNKNOWN;
    }
  } else if (invoice.fundingAgreement && invoice.fundingAgreement.signatures) {
    return STATUS.ACCEPTED;
  } else if (invoice.fundingAgreement) {
    return STATUS.PENDING;
  }

  return STATUS.NO_STATUS;

};

