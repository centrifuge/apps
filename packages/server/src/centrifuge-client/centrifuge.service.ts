import {
  AccountsApi,
  DocumentsApi,
  FundingAgreementsApi,
  InvoicesApi,
  JobsApi,
  JobsStatusResponse,
  NFTsApi,
  NFTsBetaApi,
  TransferDetailsApi,
} from '@centrifuge/gateway-lib/centrifuge-node-client';
import config from '../config';
import { promisify } from 'util';
import { BadRequestException } from '@nestjs/common';

const delay = promisify(setTimeout);

export class CentrifugeService {
  public documents: DocumentsApi;
  public accounts: AccountsApi;
  public invoices: InvoicesApi;
  public funding: FundingAgreementsApi;
  public nftBeta: NFTsBetaApi;
  public nft: NFTsApi;
  public job: JobsApi;
  public transfer: TransferDetailsApi;

  constructor() {

    this.documents = new DocumentsApi({}, config.centrifugeUrl);
    this.accounts = new AccountsApi({}, config.centrifugeUrl);
    this.invoices = new InvoicesApi({}, config.centrifugeUrl);
    this.funding = new FundingAgreementsApi({}, config.centrifugeUrl);
    this.nft = new NFTsApi({}, config.centrifugeUrl);
    this.nftBeta = new NFTsBetaApi({}, config.centrifugeUrl);
    this.job = new JobsApi({}, config.centrifugeUrl);
    this.transfer = new TransferDetailsApi({}, config.centrifugeUrl);
  }

  pullForJobComplete(jobId: string, authorization: string): Promise<JobsStatusResponse> {
    return this.job.getJobStatus(authorization, jobId).then(result => {
      if (result.status === 'pending') {
        return delay(500).then(() => this.pullForJobComplete(jobId, authorization));
      } else if(result.status === 'failed') {
        throw new BadRequestException(result.message);
      } else {
        console.log('complete', result);
        return result;
      }
    });
  }
}
