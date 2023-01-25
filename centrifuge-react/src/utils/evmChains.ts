import type { AddEthereumChainParameter } from '@web3-react/types'

type BasicChainInformation = {
  urls: string[]
  name: string
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

// export const CHAINS = {
//   1: {
//     urls: [
//       process.env.infuraKey ? `https://mainnet.infura.io/v3/${process.env.infuraKey}` : '',
//       process.env.alchemyKey ? `https://eth-mainnet.alchemyapi.io/v2/${process.env.alchemyKey}` : '',
//       'https://cloudflare-eth.com',
//     ].filter((url) => url !== ''),
//     name: 'Mainnet',
//   },
//   5: {
//     urls: [process.env.infuraKey ? `https://goerli.infura.io/v3/${process.env.infuraKey}` : ''].filter(
//       (url) => url !== ''
//     ),
//     name: 'Görli',
//   },
// }

export function getEvmUrls(chains: EvmChains) {
  return Object.keys(chains).reduce<{ [chainId: number]: string[] }>((accumulator, chainId) => {
    const validURLs: string[] = chains[Number(chainId)].urls

    if (validURLs.length) {
      accumulator[Number(chainId)] = validURLs
    }

    return accumulator
  }, {})
}
