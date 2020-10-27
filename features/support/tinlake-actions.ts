import { ethers } from 'ethers'
import Tinlake, { ITinlake } from '@centrifuge/tinlake-js'

import { CentrifugeWorld } from './world'
import { config } from './config';

export async function ensureTinlakeInit(world: CentrifugeWorld): Promise<ITinlake> {
  if (world.tinlake) {
    return world.tinlake
  }

  const provider = new ethers.providers.JsonRpcProvider(config.rpcUrl)
  const wallet = new ethers.Wallet(config.ethAdminPrivateKey, provider)

  world.tinlake = new Tinlake({
    provider,
    transactionTimeout: 3600,
    contractAddresses: config.tinlakePool.addresses,
    signer: wallet.connect(provider),
    contractConfig: config.tinlakePool.contractConfig,
    overrides: { gasLimit: config.gasLimit }
  }) as any;

  // await world.tinlake.setContractAddresses()

  return world.tinlake
}