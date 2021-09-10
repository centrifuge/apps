import Tinlake, { ContractAddresses, ITinlake } from '@centrifuge/tinlake-js'
import { ethers } from 'ethers'
import config from '../../config'

const { transactionTimeout } = config

// createTinlakeInstance returns every time a new tinlake instance
export function createTinlakeInstance({
  addresses,
  contractConfig,
}: {
  addresses: ContractAddresses
  contractConfig?: any | null
}): ITinlake {
  const rpcProvider = new ethers.providers.JsonRpcProvider(config.rpcUrl)
  return new Tinlake({
    transactionTimeout,
    contractConfig,
    overrides: {},
    provider: rpcProvider,
    contractAddresses: addresses,
  }) as ITinlake
}
