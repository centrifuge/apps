import { InvoiceResponse } from './interfaces';

export enum FUNDING_STATUS {
  NO_STATUS = '',
  PENDING = 'Requested',
  ACCEPTED = 'Accepted',
  SETTLED = 'Settled',
  REPAID = 'Repaid',
  UNKNOWN = 'Unknown',
  REPAYING_FUNDING = 'Repaying',
  SENDING_FUNDING = 'Funding',
  FUNDED = 'Funded',

}


export enum TRANSFER_DETAILS_STATUS {
  OPENED = 'opened',
  SETTLED = 'settled',
}

export const getInvoiceFundingStatus = (invoice: InvoiceResponse) => {

  if (invoice.fundingAgreement && invoice.fundingAgreement.signatures && invoice.transferDetails) {
    const fundingTransfer = invoice.transferDetails[0];
    const repaymentTransfer = invoice.transferDetails[1];
    if (fundingTransfer && fundingTransfer.status === TRANSFER_DETAILS_STATUS.OPENED && !repaymentTransfer) {
      return FUNDING_STATUS.SENDING_FUNDING;
    } else if (fundingTransfer && fundingTransfer.status === TRANSFER_DETAILS_STATUS.SETTLED && !repaymentTransfer) {
      return FUNDING_STATUS.FUNDED;
    } else if (fundingTransfer && fundingTransfer.status === TRANSFER_DETAILS_STATUS.SETTLED && repaymentTransfer && repaymentTransfer.status === TRANSFER_DETAILS_STATUS.OPENED) {
      return FUNDING_STATUS.REPAYING_FUNDING;
    } else if (fundingTransfer && fundingTransfer.status === TRANSFER_DETAILS_STATUS.SETTLED && repaymentTransfer && repaymentTransfer.status === TRANSFER_DETAILS_STATUS.SETTLED) {
      return FUNDING_STATUS.REPAID;
    } else {
      return FUNDING_STATUS.UNKNOWN;
    }
  } else if (invoice.fundingAgreement && invoice.fundingAgreement.signatures) {
    return FUNDING_STATUS.ACCEPTED;
  } else if (invoice.fundingAgreement) {
    return FUNDING_STATUS.PENDING;
  }

  return FUNDING_STATUS.NO_STATUS;

};

