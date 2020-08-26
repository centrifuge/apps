import Tinlake, { ITinlake } from 'tinlake'
import { ContractAddresses } from 'tinlake/dist/Tinlake'
import Eth from 'ethjs'
import { ethers } from 'ethers'
import config from '../../config'

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
    tinlake = new Tinlake({ transactionTimeout, provider: getDefaultHttpProvider() }) as any
    tinlake!.setEthConfig({ gas: config.gas, gasPrice: config.gasPrice })

    if (window && (window as any).ethereum) {
      const web3Provider = new ethers.providers.Web3Provider((window as any).ethereum)
      const ethersConfig = {
        provider: web3Provider, // TODO: consensus provider
        signer: web3Provider.getSigner(),
        overrides: {
          gasLimit: Number(config.gasLimit),
          gasPrice: Number(config.gasPrice),
        },
      }
      console.log('setEthersConfig', ethersConfig)
      tinlake!.setEthersConfig(ethersConfig)
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
