import {
  AccountsApi,
  DocumentsApi,
  JobsApi,
  NFTsApi,
  V2Job as JobsStatusResponse,
} from '@centrifuge/gateway-lib/centrifuge-node-client'
import { promisify } from 'util'
import config from '../config'

const delay = promisify(setTimeout)

type JobStatusWrapper = {
  jobResult: JobsStatusResponse
  jobStatus: Boolean
}

export class CentrifugeService {
  public documents: DocumentsApi
  public accounts: AccountsApi
  public nft: NFTsApi
  public job: JobsApi

  constructor() {
    this.documents = new DocumentsApi({}, config.centrifugeUrl)
    this.accounts = new AccountsApi({}, config.centrifugeUrl)
    this.nft = new NFTsApi({}, config.centrifugeUrl)
    this.job = new JobsApi({}, config.centrifugeUrl)
  }

  pullForJobComplete(jobId: string, authorization: string): Promise<JobStatusWrapper> {
    return this.job.getJob(authorization, jobId).then((result) => {
      if (!result.finished) {
        return delay(250).then(() => this.pullForJobComplete(jobId, authorization))
      } else {
        const currentTask = result.tasks[result.tasks.length - 1]
        if (currentTask && currentTask.error) {
          console.log('Job Failed', currentTask.error)
          return { jobResult: result, jobStatus: false }
        } else {
          console.log('Job Complete', result)
          return { jobResult: result, jobStatus: true }
        }
      }
    })
  }
}
