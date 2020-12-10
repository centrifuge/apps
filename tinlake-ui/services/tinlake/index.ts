import Tinlake, { ITinlake } from '@centrifuge/tinlake-js'
import { ethers } from 'ethers'
import config from '../../config'

type ContractAddresses = {
  [key: string]: string
}

let tinlake: ITinlake | null = null
let currentAddresses: null | ContractAddresses = null
let currentContractConfig: null | any = null

// initTinlake returns a singleton tinlake. Tinlake is re-intialized if addresses or contractConfig has been changed.
export function initTinlake({
  addresses,
  contractConfig,
}: { addresses?: ContractAddresses | null; contractConfig?: any | null } = {}): ITinlake {
  if (tinlake === null) {
    const { transactionTimeout } = config
    const rpcProvider = new ethers.providers.JsonRpcProvider(config.rpcUrl)
    // const overrides = config.network === 'Kovan' ? { gasLimit: config.gasLimit } : {}
    const overrides = {}

    tinlake = (new Tinlake({ transactionTimeout, overrides, provider: rpcProvider }) as unknown) as ITinlake
  }

  let resetContractAddresses = false
  if (!deepEqual(addresses || null, currentAddresses)) {
    currentAddresses = addresses || null
    tinlake!.contractAddresses = currentAddresses || {}
    resetContractAddresses = true
  }

  if (!deepEqual(contractConfig || null, currentContractConfig)) {
    currentContractConfig = contractConfig || null
    tinlake!.contractConfig = currentContractConfig || {}
    resetContractAddresses = true
  }

  if (resetContractAddresses && tinlake!.contractAddresses && tinlake!.contractConfig) {
    tinlake!.setContracts!()
  }

  return tinlake!
}

export function getTinlake(): ITinlake | null {
  return tinlake
}

function deepEqual(a: any, b: any): boolean {
  return JSON.stringify(a) === JSON.stringify(b)
}
