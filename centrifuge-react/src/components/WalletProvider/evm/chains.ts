import type { AddEthereumChainParameter } from '@web3-react/types'

type BasicChainInformation = {
  urls: string[]
  name: string
  logo?: {
    src: string
    alt?: string
  }
}

type ExtendedChainInformation = BasicChainInformation & {
  nativeCurrency: AddEthereumChainParameter['nativeCurrency']
  blockExplorerUrls: AddEthereumChainParameter['blockExplorerUrls']
}

export type EvmChains = { [chainId: number]: BasicChainInformation | ExtendedChainInformation }

export function getAddChainParameters(chains: EvmChains, chainId: number): AddEthereumChainParameter | number {
  const chainInformation = chains[chainId]
  if (chainInformation && 'nativeCurrency' in chainInformation) {
    return {
      chainId,
      chainName: chainInformation.name,
      nativeCurrency: chainInformation.nativeCurrency,
      rpcUrls: chainInformation.urls,
      blockExplorerUrls: chainInformation.blockExplorerUrls,
    }
  } else {
    return chainId
  }
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
