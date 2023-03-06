import type { AddEthereumChainParameter } from '@web3-react/types'

type BasicChainInformation = {
  urls: string[]
  iconUrl?: string
}

type ExtendedChainInformation = BasicChainInformation & {
  name: string
  nativeCurrency: AddEthereumChainParameter['nativeCurrency']
  blockExplorerUrl: string
}

export type EvmChains = { [chainId in 1 | 5]?: BasicChainInformation } | { [chainId: number]: ExtendedChainInformation }

export function getAddChainParameters(chains: EvmChains, chainId: number): AddEthereumChainParameter | number {
  const chainInfo = chains[chainId]
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
    const validURLs: string[] = chains[Number(chainId)].urls

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
  5: {
    name: 'Görli',
    nativeCurrency: { name: 'Görli Ether', symbol: 'görETH', decimals: 18 },
    blockExplorerUrl: 'https://goerli.etherscan.io/',
  },
}

export function getChainInfo(chains: EvmChains, chainId: number): ExtendedChainInformation {
  const chainInfo = chains[chainId]
  const chainInfoExtended = chainExtendedInfo[chainId]
  return {
    ...chainInfoExtended,
    ...chainInfo,
  }
}
