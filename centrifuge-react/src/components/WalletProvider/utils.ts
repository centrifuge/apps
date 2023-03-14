import * as React from 'react'
import { CentrifugeContext } from '../CentrifugeProvider/CentrifugeProvider'
import { EvmChains, getChainInfo } from './evm/chains'
import { Network } from './types'
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
  } = useWallet()

  function getEvmUrl(networkOverride?: Network) {
    const netw = networkOverride ?? network
    return typeof netw === 'number' ? getChainInfo(chains, netw)?.blockExplorerUrl : ''
  }

  return {
    address: (address: string, networkOverride?: Network) => {
      try {
        const evmUrl = getEvmUrl(networkOverride)
        return (evmUrl ? new URL(`/address/${address}`, evmUrl) : new URL(`/account/${address}`, subscanUrl)).toString()
      } catch (error) {
        console.warn(error)
        return ''
      }
    },
    tx: (hash: string, networkOverride?: Network) => {
      try {
        const evmUrl = getEvmUrl(networkOverride)
        return (evmUrl ? new URL(`/tx/${hash}`, evmUrl) : new URL(`/extrinsic/${hash}`, subscanUrl)).toString()
      } catch (error) {
        console.warn(error)
        return ''
      }
    },
  }
}
