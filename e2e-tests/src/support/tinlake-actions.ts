import Tinlake, { ITinlake } from '@centrifuge/tinlake-js'
import { ethers } from 'ethers'
import { config } from '../config'
import { CentrifugeWorld } from './world'

export async function ensureTinlakeInit(world: CentrifugeWorld): Promise<ITinlake> {
  if (world.tinlake) {
    return world.tinlake
  }

  const provider = new ethers.providers.JsonRpcProvider(config.rpcUrl)
  const wallet = new ethers.Wallet(config.ethAdminPrivateKey, provider)

  world.tinlake = new Tinlake({
    provider,
    transactionTimeout: 3600,
    contractAddresses: config.pool.addresses,
    signer: wallet.connect(provider),
    overrides: { gasLimit: config.gasLimit },
  }) as any

  return world.tinlake
}
