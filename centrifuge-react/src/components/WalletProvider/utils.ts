import { addressToHex } from '@centrifuge/centrifuge-js'
import { u8aToHex } from '@polkadot/util'
import { createKeyMulti, sortAddresses } from '@polkadot/util-crypto'
import * as React from 'react'
import { CentrifugeContext } from '../CentrifugeProvider/CentrifugeProvider'
import { EvmChains, getChainInfo } from './evm/chains'
import { ComputedMultisig, Multisig, Network } from './types'
import { useWallet } from './WalletProvider'

export function getNetworkName(network: Network, evmChains: EvmChains, centrifugeNetworkName = 'Centrifuge') {
  return network === 'centrifuge' ? centrifugeNetworkName : getChainInfo(evmChains, network)?.name ?? 'Unknown'
}

export function useGetNetworkName(evmChains = useWallet().evm.chains) {
  const { centrifuge } = React.useContext(CentrifugeContext)
  const centNetworkName = centrifuge?.config.network === 'altair' ? 'Altair' : 'Centrifuge'
  return (network: Network) => getNetworkName(network, evmChains, centNetworkName)
}

export function useNetworkName(network: Network) {
  return useGetNetworkName()(network)
}

export function useGetExplorerUrl(network?: Network) {
  const {
    evm: { chains },
    substrate: { subscanUrl },
    connectedNetwork,
  } = useWallet()

  function getEvmUrl(networkOverride?: Network) {
    const netw = networkOverride || network || connectedNetwork
    return typeof netw === 'number' ? getChainInfo(chains, netw)?.blockExplorerUrl : ''
  }

  return {
    address: (address: string, networkOverride?: Network) => {
      try {
        const evmUrl = getEvmUrl(networkOverride)
        return (evmUrl ? new URL(`/address/${address}`, evmUrl) : new URL(`/account/${address}`, subscanUrl)).toString()
      } catch {
        return ''
      }
    },
    tx: (hash: string, networkOverride?: Network) => {
      try {
        const evmUrl = getEvmUrl(networkOverride)
        return (evmUrl ? new URL(`/tx/${hash}`, evmUrl) : new URL(`/extrinsic/${hash}`, subscanUrl)).toString()
      } catch {
        return ''
      }
    },
  }
}

// Computes multisig address and sorts signers
export function computeMultisig(multisig: Multisig): ComputedMultisig {
  const address = u8aToHex(createKeyMulti(multisig.signers, multisig.threshold))
  return {
    address,
    signers: sortAddresses(multisig.signers).map(addressToHex),
    threshold: multisig.threshold,
  }
}
