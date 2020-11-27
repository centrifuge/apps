const dotenv = require('dotenv')
const ethers = require('ethers')
const { exit } = require('process')
const { TinlakeWithActions } = require('..')

dotenv.config()

for (let key of ['RPC_URL', 'GOD_PRIV_KEY', 'CONTRACTS']) {
  if (!process.env[key]) {
    console.error(`Environment variable ${key} needs to be present in the .env file`)
    exit()
  }
}

const provider = new ethers.providers.JsonRpcProvider(process.env.RPC_URL)
const wallet = new ethers.Wallet(process.env.GOD_PRIV_KEY, this.provider)

const tinlake = new TinlakeWithActions({
  provider,
  contractAddresses: process.env.CONTRACTS && JSON.parse(process.env.CONTRACTS),
  signer: wallet.connect(provider),
  overrides: { gasLimit: 7000000 },
})

console.log('Initialized Tinlake.js v3')

const run = async () => {
  console.log('Retrieving epoch state')
  const epochId = await tinlake.getCurrentEpochId()
  const epochState = await tinlake.getCurrentEpochState()

  console.log(`Epoch ${epochId}: ${epochState}`)

  if (epochState === 'open') {
    console.error('Solver cannot be run when epoch state is open')
    exit()
  }

  try {
    console.log('Running solver')

    const solveTx = await tinlake.solveEpoch()
    const solveResult = await tinlake.getTransactionReceipt(solveTx)

    if (solveResult.status === 1) {
      console.log('Successfully ran the solver and submitted a solution')
      console.log(`Transaction hash: ${solveTx.hash}`)

      const epochState = await tinlake.getCurrentEpochState()
      console.log(`New epoch state: ${epochState}`)
    } else {
      console.error('Failed to run the solver')
    }
  } catch(error) {
    console.error(error)
  }
}

run()