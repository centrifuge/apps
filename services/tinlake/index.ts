import Tinlake, { ITinlake } from '@centrifuge/tinlake-js'
import { default as TinlakeV3, ITinlake as ITinlakeV3 } from '@centrifuge/tinlake-js-v3'
import { ethers } from 'ethers'
import config from '../../config'

type ContractAddresses = {
  [key: string]: string
}

let tinlake: ITinlake | ITinlakeV3 | null = null
let currentAddresses: null | ContractAddresses = null
let currentContractConfig: null | any = null

// initTinlake returns a singleton tinlake. Tinlake is re-intialized if addresses or contractConfig has been changed.
export function initTinlake({
  version,
  addresses,
  contractConfig,
}: { version?: 2 | 3; addresses?: ContractAddresses | null; contractConfig?: any | null } = {}): ITinlake | ITinlakeV3 {
  if (tinlake === null || version !== tinlake.version) {
    const { transactionTimeout } = config
    const rpcProvider = new ethers.providers.JsonRpcProvider(config.rpcUrl)
    const overrides = config.network === 'Kovan' ? { gasLimit: config.gasLimit } : {}

    if (version === 2) {
      tinlake = (new Tinlake({ transactionTimeout, overrides, provider: rpcProvider }) as unknown) as ITinlake
    } else {
      tinlake = new TinlakeV3({ transactionTimeout, overrides, provider: rpcProvider }) as ITinlakeV3
    }
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

export function getTinlake(): ITinlake | ITinlakeV3 | null {
  return tinlake
}

function deepEqual(a: any, b: any): boolean {
  return JSON.stringify(a) === JSON.stringify(b)
}
