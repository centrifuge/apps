import {
  FunFundingResponseData,
  InvoiceData,
  TransferdetailsData,
  UserapiInvoiceResponse,
  UserapiPurchaseOrderResponse,
} from '../../clients/centrifuge-node';
import { Invoice } from './models/invoice';

//TODO break all interfaces up and move to models
//TODO Refactor this. The name is bad. Is it very interface specic ? Do we need an interface for this?
export interface LabelValuePair {
  label: string;
  value: string;
}


export interface InvoiceResponse extends UserapiInvoiceResponse {
  data?: Invoice | InvoiceData;
  ownerId?: string;
  _id?: string;
  createdAt?: Date,
  updatedAt?: Date
  fundingAgreement?: FundingAgreementResponse | null
  transferDetails?: Array<TransferdetailsData> | null
}

export interface FundingAgreementResponse extends FunFundingResponseData {
  nftOwner?: string
  nftRegistry?: string
}

export interface PurchaseOrderResponse
  extends UserapiPurchaseOrderResponse {
  ownerId?: string;
  _id?: string;
}
