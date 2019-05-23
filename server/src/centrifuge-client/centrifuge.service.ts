import {
  AccountServiceApi,
  DocumentServiceApi,
  FundingServiceApi,
  InvoiceServiceApi,
  JobServiceApi,
  JobsJobStatusResponse,
  NFTServiceApi,
  PurchaseOrderServiceApi,
} from '../../../clients/centrifuge-node';
import config from '../../../src/common/config';
const delay = require('util').promisify(setTimeout);

export class CentrifugeService {
  public documents: DocumentServiceApi;
  public accounts: AccountServiceApi;
  public invoices: InvoiceServiceApi;
  public purchaseOrders: PurchaseOrderServiceApi;
  public funding: FundingServiceApi;
  public nft: NFTServiceApi;
  public job: JobServiceApi;

  constructor() {

    this.documents = new DocumentServiceApi({}, config.centrifugeUrl);
    this.accounts = new AccountServiceApi({}, config.centrifugeUrl);
    this.invoices = new InvoiceServiceApi({}, config.centrifugeUrl);
    this.purchaseOrders = new PurchaseOrderServiceApi({}, config.centrifugeUrl);
    this.funding = new FundingServiceApi({}, config.centrifugeUrl);
    this.nft = new NFTServiceApi({}, config.centrifugeUrl);
    this.job = new JobServiceApi({}, config.centrifugeUrl);
  }

   pullForJobComplete(jobId: string, authorization: string): Promise<JobsJobStatusResponse> {
    return this.job.getJobStatus(jobId, authorization).then(result => {
      if (result.status === 'pending') {
        return delay(500).then(() => this.pullForJobComplete(jobId, authorization));
      } else {
        return result;
      }
    });
  }
}
