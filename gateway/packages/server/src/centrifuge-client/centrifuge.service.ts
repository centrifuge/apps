import {
  AccountsApi,
  DocumentsApi,
  FundingAgreementsApi,
  JobsApi,
  JobsStatusResponse,
  NFTsApi,
  TransferDetailsApi,
} from '@centrifuge/gateway-lib/centrifuge-node-client'
import { promisify } from 'util'
import config from '../config'

const delay = promisify(setTimeout)

export class CentrifugeService {
  public documents: DocumentsApi
  public accounts: AccountsApi
  public funding: FundingAgreementsApi
  public nft: NFTsApi
  public job: JobsApi
  public transfer: TransferDetailsApi

  constructor() {
    this.documents = new DocumentsApi({}, config.centrifugeUrl)
    this.accounts = new AccountsApi({}, config.centrifugeUrl)
    this.funding = new FundingAgreementsApi({}, config.centrifugeUrl)
    this.nft = new NFTsApi({}, config.centrifugeUrl)
    this.job = new JobsApi({}, config.centrifugeUrl)
    this.transfer = new TransferDetailsApi({}, config.centrifugeUrl)
  }

  pullForJobComplete(jobId: string, authorization: string): Promise<JobsStatusResponse> {
    return this.job.getJobStatus(authorization, jobId).then((result) => {
      if (!result.finished) {
        return delay(250).then(() => this.pullForJobComplete(jobId, authorization))
      } else {
        const currentTask = result.tasks[result.tasks.length - 1]
        if (currentTask && currentTask.error) {
          console.log('Job Failed', currentTask.error)
        } else {
          console.log('Job Complete', result)
        }
        return result
      }
    })
  }
}
