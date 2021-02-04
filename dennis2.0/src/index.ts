import { CronJob } from 'cron'

import { loadFromIPFS, PoolMap } from './util/ipfs'
import config from './config'
import CronExpression from './util/CronExpression'
import { ethers } from 'ethers'
import { closePools } from './tasks/closePools'
import { executePools } from './tasks/executePools'
import { submitSolutions } from './tasks/submitSolutions'

const provider = new ethers.providers.JsonRpcProvider(config.rpcUrl)
// TODO: from json key store
const signer = new ethers.Wallet(config.signerPrivateKey).connect(provider)
let pools: PoolMap = {}

const run = async () => {
  console.log('Booting Dennis 2.0')
  pools = await loadFromIPFS(provider)

  await closePools(pools, provider, signer)
  await submitSolutions(pools, provider, signer)
  await executePools(pools, provider, signer)

  let cronJobs: Map<string, CronJob> = new Map<string, CronJob>()

  let retrievePoolsTask = new CronJob(CronExpression.EVERY_30_MINUTES, async () => {
    // Update the list of pools every 30 minutes
    pools = await loadFromIPFS(provider)
  })
  cronJobs.set('retrievePools', retrievePoolsTask)

  let closePoolsTask = new CronJob('0 14 * * *', async () => {
    // Close pool epochs every day at 3pm CET (2pm UTC)
    await closePools(pools, provider, signer)
  })
  cronJobs.set('closePools', closePoolsTask)

  let submitSolutionsTask = new CronJob(CronExpression.EVERY_10_MINUTES, async () => {
    // Submit solutions every 10 minutes
    await submitSolutions(pools, provider, signer)
  })
  cronJobs.set('submitSolutions', submitSolutionsTask)

  let executePoolsTask = new CronJob(CronExpression.EVERY_5_MINUTES, async () => {
    // Execute pool epochs every 5 minutes
    await executePools(pools, provider, signer)
  })
  cronJobs.set('executePools', executePoolsTask)

  cronJobs.forEach((task, _) => task.start())
}

run()
