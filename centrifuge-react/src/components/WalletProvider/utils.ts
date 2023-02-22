import * as React from 'react'
import { CentrifugeContext } from '../CentrifugeProvider/CentrifugeProvider'
import { EvmChains } from './evm/chains'
import { Network } from './types'
import { useWallet } from './WalletProvider'

export function getNetworkName(network: Network, evmChains: EvmChains, centrifugeNetworkName = 'Centrifuge') {
  return network === 'centrifuge' ? centrifugeNetworkName : evmChains[network]?.name ?? 'Unknown'
}

export function useGetNetworkName() {
  const { centrifuge } = React.useContext(CentrifugeContext)
  const {
    evm: { chains },
  } = useWallet()
  const centNetworkName = centrifuge?.config.network === 'altair' ? 'Altair' : 'Centrifuge'
  return (network: Network) => getNetworkName(network, chains, centNetworkName)
}
export function useNetworkName(network: Network) {
  return useGetNetworkName()(network)
}
