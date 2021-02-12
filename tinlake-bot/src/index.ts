import { CronJob } from 'cron'
import { ethers } from 'ethers'
import config from './config'
import { closePools } from './tasks/closePools'
import { executePools } from './tasks/executePools'
import { submitSolutions } from './tasks/submitSolutions'
import CronExpression from './util/CronExpression'
import { loadFromIPFS, PoolMap } from './util/ipfs'

const provider = new ethers.providers.JsonRpcProvider(config.rpcUrl)
let pools: PoolMap = {}

const run = async () => {
  console.log('Decrypting wallet')
  const signer = await ethers.Wallet.fromEncryptedJson(config.signerEncryptedJson, config.signerPassword)
  const signerWithProvider = signer.connect(provider)

  console.log(`Booting Dennis 2.0 as ${signer.address}`)
  pools = await loadFromIPFS(provider)

  let cronJobs: Map<string, CronJob> = new Map<string, CronJob>()

  let retrievePoolsTask = new CronJob(CronExpression.EVERY_30_MINUTES, async () => {
    // Update the list of pools every 30 minutes
    pools = await loadFromIPFS(provider)
  })
  cronJobs.set('retrievePools', retrievePoolsTask)

  let closePoolsTask = new CronJob('0 14 * * *', async () => {
    // Close pool epochs every day at 3pm CET (2pm UTC)
    await closePools(pools, provider, signerWithProvider)
  })
  cronJobs.set('closePools', closePoolsTask)

  let submitSolutionsTask = new CronJob(CronExpression.EVERY_10_MINUTES, async () => {
    // Submit solutions every 10 minutes
    await submitSolutions(pools, provider, signerWithProvider)
  })
  cronJobs.set('submitSolutions', submitSolutionsTask)

  let executePoolsTask = new CronJob(CronExpression.EVERY_5_MINUTES, async () => {
    // Execute pool epochs every 5 minutes
    await executePools(pools, provider, signerWithProvider)
  })
  cronJobs.set('executePools', executePoolsTask)

  cronJobs.forEach((task, _) => task.start())
}

run()
