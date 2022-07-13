import { CronJob } from 'cron'
import { ethers } from 'ethers'
import config from './config'
import { checkDueAssets } from './tasks/checkDueAssets'
import { executePools } from './tasks/executePools'
import { sendSupplyRedeemSummary } from './tasks/sendSupplyRedeemSummary'
import { submitSolutions } from './tasks/submitSolutions'
import { writeoffAssets } from './tasks/writeoffAssets'
import { TransactionManager } from './tx-manager'
import CronExpression from './util/CronExpression'
import { loadFromIPFS, PoolMap } from './util/ipfs'
require('log-timestamp')

const provider = new ethers.providers.JsonRpcProvider(config.rpcUrl)
let pools: PoolMap = {}

const run = async () => {
  console.log('Decrypting wallet')
  const wallet = await ethers.Wallet.fromEncryptedJson(config.signerEncryptedJson, config.signerPassword)

  console.log(`Awaiting JSON RPC provider connection`)
  await provider.ready

  if (config.excludedPools.length > 0) {
    console.log(`Excluding pools: ${config.excludedPools.join(', ')}`)
  }

  const signer = new TransactionManager(wallet).connect(provider)

  console.log(`Booting Tinlake Bot as ${wallet.address}`)
  pools = await loadFromIPFS(provider, config.excludedPools)

  let cronJobs: Map<string, CronJob> = new Map<string, CronJob>()

  let retrievePoolsTask = new CronJob(CronExpression.EVERY_HOUR, async () => {
    // Update the list of pools every 30 minutes
    pools = await loadFromIPFS(provider, config.excludedPools)
  })
  cronJobs.set('retrievePools', retrievePoolsTask)

  let submitSolutionsTask = new CronJob(CronExpression.EVERY_30_MINUTES, async () => {
    // Submit solutions every x minutes
    await submitSolutions(pools, provider, signer)
  })
  cronJobs.set('submitSolutions', submitSolutionsTask)

  let executePoolsTask = new CronJob(CronExpression.EVERY_30_MINUTES, async () => {
    // Execute pool epochs every x minutes
    await executePools(pools, provider, signer)
  })
  cronJobs.set('executePools', executePoolsTask)

  let checkDueAssetsTask = new CronJob('0 14 * * *', async () => {
    // Check due assets every day at 3pm CET (2pm UTC)
    await checkDueAssets(pools)
  })
  cronJobs.set('checkDueAssets', checkDueAssetsTask)

  let writeoffAssetsTask = new CronJob('0 15 * * *', async () => {
    // Check due assets every day at 4pm CET (3pm UTC)
    await writeoffAssets(pools)
  })
  cronJobs.set('writeoffAssets', writeoffAssetsTask)

  let sendSupplyRedeemSummaryTask = new CronJob('0 9 * * *', async () => {
    // Sends supply and redeem summary to Slack every day at 10am CET (9am UTC)
    await sendSupplyRedeemSummary(pools, provider, signer)
  })
  cronJobs.set('sendSupplyRedeemSummary', sendSupplyRedeemSummaryTask)

  cronJobs.forEach((task, _) => task.start())
}

run()
