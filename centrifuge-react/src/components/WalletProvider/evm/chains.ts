import type { AddEthereumChainParameter } from '@web3-react/types'

type BasicChainInformation = {
  urls: string[]
  iconUrl?: string
  isTestnet: boolean
}

type ExtendedChainInformation = BasicChainInformation & {
  network: string
  name: string
  nativeCurrency: AddEthereumChainParameter['nativeCurrency']
  blockExplorerUrl: string
}

export type EvmChains = { [chainId in 1 | 5]?: BasicChainInformation } | { [chainId: number]: ExtendedChainInformation }

export function getAddChainParameters(chains: EvmChains, chainId: number): AddEthereumChainParameter | number {
  const chainInfo = (chains as any)[chainId]
  if (chainInfo && 'nativeCurrency' in chainInfo) {
    return {
      chainId,
      chainName: chainInfo.name,
      nativeCurrency: chainInfo.nativeCurrency,
      rpcUrls: chainInfo.urls,
      blockExplorerUrls: [chainInfo.blockExplorerUrl],
      iconUrls: chainInfo.iconUrl ? [chainInfo.iconUrl] : undefined,
    }
  }
  return chainId
}

export function getEvmUrls(chains: EvmChains) {
  return Object.keys(chains).reduce<{ [chainId: number]: string[] }>((accumulator, chainId) => {
    const validURLs: string[] = (chains as any)[Number(chainId)].urls

    if (validURLs.length) {
      accumulator[Number(chainId)] = validURLs
    }

    return accumulator
  }, {})
}

const chainExtendedInfo = {
  1: {
    name: 'Ethereum',
    nativeCurrency: { name: 'Ether', symbol: 'ETH', decimals: 18 },
    blockExplorerUrl: 'https://etherscan.io/',
  },
}

export function getChainInfo(chains: EvmChains, chainId: number): ExtendedChainInformation {
  const chainInfo = (chains as any)[chainId]
  const chainInfoExtended = (chainExtendedInfo as any)[chainId]
  return {
    ...chainInfoExtended,
    ...chainInfo,
  }
}
