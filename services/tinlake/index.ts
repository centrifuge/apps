import Tinlake, { ITinlake } from '@centrifuge/tinlake-js'
import Eth from 'ethjs'
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
    if (window && (window as any).ethereum) {
      const web3Provider = new ethers.providers.Web3Provider((window as any).ethereum)
      const rpcProvider = new ethers.providers.JsonRpcProvider(config.rpcUrl)
      const fallbackProvider = new ethers.providers.FallbackProvider([web3Provider, rpcProvider])

      const ethersConfig = {
        provider: fallbackProvider,
        signer: web3Provider.getSigner(),
      }
      tinlake = new Tinlake({ transactionTimeout, ethersConfig, provider: getDefaultHttpProvider() }) as any
    } else {
      tinlake = new Tinlake({ transactionTimeout, provider: getDefaultHttpProvider() }) as any
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

export function getTinlake(): ITinlake | null {
  return tinlake
}

export function getDefaultHttpProvider(): any {
  const { rpcUrl } = config
  const httpProvider = new Eth.HttpProvider(rpcUrl)
  return httpProvider
}

function deepEqual(a: any, b: any): boolean {
  return JSON.stringify(a) === JSON.stringify(b)
}
