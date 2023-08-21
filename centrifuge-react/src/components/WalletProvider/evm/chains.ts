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

export type EvmChains =
  | { [chainId in 1 | 5 | 43113 | 43114 | 8453 | 84531]?: BasicChainInformation }
  | { [chainId: number]: ExtendedChainInformation }

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
  136: {
    name: 'Centrifuge',
    nativeCurrency: { name: 'CFG', symbol: 'CFG', decimals: 18 },
    blockExplorerUrl: 'https://www.subscan.io/',
  },
  36: {
    name: 'Centrifuge',
    nativeCurrency: { name: 'Altair', symbol: 'AIR', decimals: 18 },
    blockExplorerUrl: 'https://www.subscan.io/',
  },
  2000: {
    name: 'Centrifuge',
    nativeCurrency: { name: 'Centrifuge', symbol: 'CFG', decimals: 18 },
    blockExplorerUrl: 'https://www.subscan.io/',
  },
  8453: {
    name: 'Base',
    nativeCurrency: { name: 'Base', symbol: 'bETH', decimals: 18 },
    blockExplorerUrl: 'https://basescan.org/',
  },
  84531: {
    name: 'Base Goerli',
    nativeCurrency: { name: 'Base Goerli', symbol: 'gbETH', decimals: 18 },
    blockExplorerUrl: 'https://goerli.basescan.org/',
  },
  43113: {
    name: 'Fuji',
    nativeCurrency: { name: 'Avalanche', symbol: 'AVAX', decimals: 18 },
    blockExplorerUrl: 'https://testnet.snowtrace.io/',
  },
  43114: {
    name: 'Avalanche',
    nativeCurrency: { name: 'Avalanche', symbol: 'AVAX', decimals: 18 },
    blockExplorerUrl: 'https://snowtrace.io/',
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
