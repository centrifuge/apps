import centrifugeLogo from '@centrifuge/fabric/assets/logos/centrifuge.svg'
import { Wallet } from '@subwallet/wallet-connect/types'
import * as React from 'react'
import { CentrifugeContext, useCentrifugeUtils } from '../CentrifugeProvider/CentrifugeProvider'
import { EvmChains, getChainInfo } from './evm/chains'
import { EvmConnectorMeta } from './evm/connectors'
import { Network } from './types'
import { useWallet } from './WalletProvider'

export function getNetworkName(
  network: Network,
  evmChains: EvmChains,
  centrifugeNetworkName = 'Centrifuge',
  substrateEvmChainId?: number | null
) {
  return network === 'centrifuge' || network === substrateEvmChainId
    ? centrifugeNetworkName
    : getChainInfo(evmChains, network)?.name ?? 'Unknown'
}

export function useGetNetworkName(
  evmChains = useWallet().evm.chains,
  substrateEvmChainId: number | null | undefined = useWallet().substrate.evmChainId
) {
  const { centrifuge } = React.useContext(CentrifugeContext)
  const centNetworkName = centrifuge?.config.network === 'altair' ? 'Altair' : 'Centrifuge'
  return (network: Network) => getNetworkName(network, evmChains, centNetworkName, substrateEvmChainId)
}

export function useNetworkName(network: Network) {
  return useGetNetworkName()(network)
}

export function useGetNetworkIcon() {
  const {
    evm,
    substrate: { evmChainId },
  } = useWallet()
  return (network: Network) =>
    network === 'centrifuge' || network === evmChainId ? centrifugeLogo : evm.chains[network]?.iconUrl ?? ''
}

export function useNetworkIcon(network: Network) {
  return useGetNetworkIcon()(network)
}

export function useGetExplorerUrl(network?: Network) {
  const {
    evm: { chains },
    substrate: { subscanUrl },
    connectedNetwork,
  } = useWallet()
  const utils = useCentrifugeUtils()

  function getEvmUrl(networkOverride?: Network) {
    const netw = networkOverride || network || connectedNetwork
    return typeof netw === 'number' ? getChainInfo(chains, netw)?.blockExplorerUrl : ''
  }

  return {
    address: (address: string, networkOverride?: Network) => {
      try {
        const evmUrl = getEvmUrl(networkOverride)
        return (
          evmUrl
            ? new URL(`/address/${address}`, evmUrl)
            : new URL(`/account/${utils.formatAddress(address)}`, subscanUrl)
        ).toString()
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

export function sortCentrifugeWallets(wallets: Wallet[]) {
  const order = {
    talisman: 1,
    'subwallet-js': 2,
    'polkadot-js': 3,
  }

  return wallets
    .filter(({ extensionName }) => order[extensionName])
    .sort((a, b) => order[a.extensionName] - order[b.extensionName])
    .concat(wallets.filter(({ extensionName }) => !order[extensionName]))
}

export function sortEvmWallets(wallets: EvmConnectorMeta[]) {
  const order = {
    metamask: 1,
    walletconnect: 2,
    coinbase: 3,
  }

  return wallets
    .filter(({ id }) => order[id])
    .sort((a, b) => order[a.id] - order[b.id])
    .concat(wallets.filter(({ id }) => !order[id]))
}
